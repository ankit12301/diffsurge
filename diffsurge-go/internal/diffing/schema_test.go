package diffing

import (
	"testing"

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ---------- helpers ----------

func strPtr(s string) *string { return &s }

func makeType(t string) *openapi3.Types {
	types := openapi3.Types{t}
	return &types
}

func makeSpec(paths openapi3.Paths, schemas openapi3.Schemas) *openapi3.T {
	spec := &openapi3.T{
		OpenAPI: "3.0.3",
		Info:    &openapi3.Info{Title: "Test", Version: "1.0.0"},
	}
	if paths.Len() > 0 {
		spec.Paths = &paths
	}
	if len(schemas) > 0 {
		spec.Components = &openapi3.Components{Schemas: schemas}
	}
	return spec
}

// ---------- Schema-level tests ----------

func TestSchemaComparer_PropertyTypeChanged(t *testing.T) {
	oldSchemas := openapi3.Schemas{
		"User": &openapi3.SchemaRef{Value: &openapi3.Schema{
			Type:     makeType("object"),
			Required: []string{"id"},
			Properties: openapi3.Schemas{
				"id": &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("integer")}},
			},
		}},
	}
	newSchemas := openapi3.Schemas{
		"User": &openapi3.SchemaRef{Value: &openapi3.Schema{
			Type:     makeType("object"),
			Required: []string{"id"},
			Properties: openapi3.Schemas{
				"id": &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
			},
		}},
	}

	sc := NewSchemaComparer()
	diffs, breaking, err := sc.Compare(
		makeSpec(openapi3.Paths{}, oldSchemas),
		makeSpec(openapi3.Paths{}, newSchemas),
	)
	require.NoError(t, err)

	// Should detect id type changed from integer to string
	found := false
	for _, bc := range breaking {
		if bc.Type == "type_changed" && bc.Path == "components.schemas.User.properties.id" {
			found = true
			assert.Contains(t, bc.Description, "integer")
			assert.Contains(t, bc.Description, "string")
		}
	}
	assert.True(t, found, "should detect property type change as breaking; breaking=%v diffs=%v", breaking, diffs)
}

func TestSchemaComparer_RequiredFieldAdded(t *testing.T) {
	oldSchemas := openapi3.Schemas{
		"Pet": &openapi3.SchemaRef{Value: &openapi3.Schema{
			Type:     makeType("object"),
			Required: []string{"name"},
			Properties: openapi3.Schemas{
				"name": &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
			},
		}},
	}
	newSchemas := openapi3.Schemas{
		"Pet": &openapi3.SchemaRef{Value: &openapi3.Schema{
			Type:     makeType("object"),
			Required: []string{"name", "species"},
			Properties: openapi3.Schemas{
				"name":    &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
				"species": &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
			},
		}},
	}

	sc := NewSchemaComparer()
	_, breaking, err := sc.Compare(
		makeSpec(openapi3.Paths{}, oldSchemas),
		makeSpec(openapi3.Paths{}, newSchemas),
	)
	require.NoError(t, err)

	found := false
	for _, bc := range breaking {
		if bc.Type == "required_field_added" && bc.Path == "components.schemas.Pet.required.species" {
			found = true
			assert.Contains(t, bc.Description, "species")
		}
	}
	assert.True(t, found, "should detect new required field as breaking; breaking=%v", breaking)
}

func TestSchemaComparer_FieldBecameRequired(t *testing.T) {
	oldSchemas := openapi3.Schemas{
		"Pet": &openapi3.SchemaRef{Value: &openapi3.Schema{
			Type:     makeType("object"),
			Required: []string{"name"},
			Properties: openapi3.Schemas{
				"name": &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
				"tag":  &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
			},
		}},
	}
	newSchemas := openapi3.Schemas{
		"Pet": &openapi3.SchemaRef{Value: &openapi3.Schema{
			Type:     makeType("object"),
			Required: []string{"name", "tag"},
			Properties: openapi3.Schemas{
				"name": &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
				"tag":  &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
			},
		}},
	}

	sc := NewSchemaComparer()
	_, breaking, err := sc.Compare(
		makeSpec(openapi3.Paths{}, oldSchemas),
		makeSpec(openapi3.Paths{}, newSchemas),
	)
	require.NoError(t, err)

	found := false
	for _, bc := range breaking {
		if bc.Type == "field_became_required" {
			found = true
			assert.Contains(t, bc.Description, "tag")
			assert.Contains(t, bc.Description, "optional to required")
		}
	}
	assert.True(t, found, "should detect field becoming required as breaking; breaking=%v", breaking)
}

func TestSchemaComparer_PropertyRemoved(t *testing.T) {
	oldSchemas := openapi3.Schemas{
		"User": &openapi3.SchemaRef{Value: &openapi3.Schema{
			Type:     makeType("object"),
			Required: []string{"id", "name"},
			Properties: openapi3.Schemas{
				"id":   &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("integer")}},
				"name": &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
				"tag":  &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
			},
		}},
	}
	newSchemas := openapi3.Schemas{
		"User": &openapi3.SchemaRef{Value: &openapi3.Schema{
			Type:     makeType("object"),
			Required: []string{"id", "name"},
			Properties: openapi3.Schemas{
				"id":   &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("integer")}},
				"name": &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
			},
		}},
	}

	sc := NewSchemaComparer()
	diffs, breaking, err := sc.Compare(
		makeSpec(openapi3.Paths{}, oldSchemas),
		makeSpec(openapi3.Paths{}, newSchemas),
	)
	require.NoError(t, err)

	// tag was optional, so removal should be warning-level
	foundBreaking := false
	for _, bc := range breaking {
		if bc.Type == "property_removed" {
			foundBreaking = true
			assert.Contains(t, bc.Description, "tag")
			assert.Equal(t, SeverityWarning, bc.Severity)
		}
	}
	assert.True(t, foundBreaking, "should detect optional property removal; breaking=%v diffs=%v", breaking, diffs)
}

func TestSchemaComparer_RequiredPropertyRemoved(t *testing.T) {
	oldSchemas := openapi3.Schemas{
		"User": &openapi3.SchemaRef{Value: &openapi3.Schema{
			Type:     makeType("object"),
			Required: []string{"id", "name"},
			Properties: openapi3.Schemas{
				"id":   &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("integer")}},
				"name": &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
			},
		}},
	}
	newSchemas := openapi3.Schemas{
		"User": &openapi3.SchemaRef{Value: &openapi3.Schema{
			Type:     makeType("object"),
			Required: []string{"id"},
			Properties: openapi3.Schemas{
				"id": &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("integer")}},
			},
		}},
	}

	sc := NewSchemaComparer()
	_, breaking, err := sc.Compare(
		makeSpec(openapi3.Paths{}, oldSchemas),
		makeSpec(openapi3.Paths{}, newSchemas),
	)
	require.NoError(t, err)

	found := false
	for _, bc := range breaking {
		if bc.Type == "required_property_removed" {
			found = true
			assert.Contains(t, bc.Description, "name")
			assert.Equal(t, SeverityBreaking, bc.Severity)
		}
	}
	assert.True(t, found, "should detect required property removal as breaking; breaking=%v", breaking)
}

func TestSchemaComparer_EnumValueRemoved(t *testing.T) {
	oldSchemas := openapi3.Schemas{
		"Pet": &openapi3.SchemaRef{Value: &openapi3.Schema{
			Type:     makeType("object"),
			Required: []string{"status"},
			Properties: openapi3.Schemas{
				"status": &openapi3.SchemaRef{Value: &openapi3.Schema{
					Type: makeType("string"),
					Enum: []interface{}{"available", "pending", "sold"},
				}},
			},
		}},
	}
	newSchemas := openapi3.Schemas{
		"Pet": &openapi3.SchemaRef{Value: &openapi3.Schema{
			Type:     makeType("object"),
			Required: []string{"status"},
			Properties: openapi3.Schemas{
				"status": &openapi3.SchemaRef{Value: &openapi3.Schema{
					Type: makeType("string"),
					Enum: []interface{}{"available", "sold", "adopted"},
				}},
			},
		}},
	}

	sc := NewSchemaComparer()
	diffs, breaking, err := sc.Compare(
		makeSpec(openapi3.Paths{}, oldSchemas),
		makeSpec(openapi3.Paths{}, newSchemas),
	)
	require.NoError(t, err)

	// "pending" removed = breaking
	foundRemoved := false
	for _, bc := range breaking {
		if bc.Type == "enum_value_removed" {
			foundRemoved = true
			assert.Contains(t, bc.Description, "pending")
		}
	}
	assert.True(t, foundRemoved, "should detect removed enum value as breaking; breaking=%v", breaking)

	// "adopted" added = info
	foundAdded := false
	for _, d := range diffs {
		if d.Type == DiffTypeAdded && d.NewValue == "adopted" {
			foundAdded = true
		}
	}
	assert.True(t, foundAdded, "should detect added enum value as info; diffs=%v", diffs)
}

// ---------- Parameter-level tests ----------

func TestSchemaComparer_ParameterBecameRequired(t *testing.T) {
	oldPaths := openapi3.Paths{}
	oldPaths.Set("/pets", &openapi3.PathItem{
		Get: &openapi3.Operation{
			Parameters: openapi3.Parameters{
				&openapi3.ParameterRef{Value: &openapi3.Parameter{
					Name:     "limit",
					In:       "query",
					Required: false,
					Schema:   &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("integer")}},
				}},
			},
			Responses: &openapi3.Responses{},
		},
	})

	newPaths := openapi3.Paths{}
	newPaths.Set("/pets", &openapi3.PathItem{
		Get: &openapi3.Operation{
			Parameters: openapi3.Parameters{
				&openapi3.ParameterRef{Value: &openapi3.Parameter{
					Name:     "limit",
					In:       "query",
					Required: true,
					Schema:   &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("integer")}},
				}},
			},
			Responses: &openapi3.Responses{},
		},
	})

	sc := NewSchemaComparer()
	_, breaking, err := sc.Compare(
		makeSpec(oldPaths, nil),
		makeSpec(newPaths, nil),
	)
	require.NoError(t, err)

	found := false
	for _, bc := range breaking {
		if bc.Type == "param_became_required" {
			found = true
			assert.Contains(t, bc.Description, "limit")
			assert.Contains(t, bc.Description, "optional to required")
		}
	}
	assert.True(t, found, "should detect parameter becoming required; breaking=%v", breaking)
}

func TestSchemaComparer_ParameterTypeChanged(t *testing.T) {
	oldPaths := openapi3.Paths{}
	oldPaths.Set("/pets/{petId}", &openapi3.PathItem{
		Get: &openapi3.Operation{
			Parameters: openapi3.Parameters{
				&openapi3.ParameterRef{Value: &openapi3.Parameter{
					Name:     "petId",
					In:       "path",
					Required: true,
					Schema:   &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("integer")}},
				}},
			},
			Responses: &openapi3.Responses{},
		},
	})

	newPaths := openapi3.Paths{}
	newPaths.Set("/pets/{petId}", &openapi3.PathItem{
		Get: &openapi3.Operation{
			Parameters: openapi3.Parameters{
				&openapi3.ParameterRef{Value: &openapi3.Parameter{
					Name:     "petId",
					In:       "path",
					Required: true,
					Schema:   &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
				}},
			},
			Responses: &openapi3.Responses{},
		},
	})

	sc := NewSchemaComparer()
	_, breaking, err := sc.Compare(
		makeSpec(oldPaths, nil),
		makeSpec(newPaths, nil),
	)
	require.NoError(t, err)

	found := false
	for _, bc := range breaking {
		if bc.Type == "param_type_changed" {
			found = true
			assert.Contains(t, bc.Description, "petId")
			assert.Contains(t, bc.Description, "integer")
			assert.Contains(t, bc.Description, "string")
		}
	}
	assert.True(t, found, "should detect parameter type change; breaking=%v", breaking)
}

func TestSchemaComparer_NewOptionalParameter(t *testing.T) {
	oldPaths := openapi3.Paths{}
	oldPaths.Set("/pets", &openapi3.PathItem{
		Get: &openapi3.Operation{
			Parameters: openapi3.Parameters{},
			Responses:  &openapi3.Responses{},
		},
	})

	newPaths := openapi3.Paths{}
	newPaths.Set("/pets", &openapi3.PathItem{
		Get: &openapi3.Operation{
			Parameters: openapi3.Parameters{
				&openapi3.ParameterRef{Value: &openapi3.Parameter{
					Name:     "cursor",
					In:       "query",
					Required: false,
					Schema:   &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
				}},
			},
			Responses: &openapi3.Responses{},
		},
	})

	sc := NewSchemaComparer()
	diffs, breaking, err := sc.Compare(
		makeSpec(oldPaths, nil),
		makeSpec(newPaths, nil),
	)
	require.NoError(t, err)

	// New optional parameter should NOT be breaking
	for _, bc := range breaking {
		assert.NotEqual(t, "cursor", bc.Path, "new optional param should not be breaking")
	}

	// Should be an info-level diff
	found := false
	for _, d := range diffs {
		if d.Type == DiffTypeAdded && d.NewValue == "cursor" {
			found = true
			assert.Equal(t, SeverityInfo, d.Severity)
		}
	}
	assert.True(t, found, "should detect new optional parameter as info diff; diffs=%v", diffs)
}

// ---------- Endpoint-level tests ----------

func TestSchemaComparer_EndpointRemoved(t *testing.T) {
	oldPaths := openapi3.Paths{}
	oldPaths.Set("/pets", &openapi3.PathItem{
		Get: &openapi3.Operation{Responses: &openapi3.Responses{}},
	})
	oldPaths.Set("/users", &openapi3.PathItem{
		Get: &openapi3.Operation{Responses: &openapi3.Responses{}},
	})

	newPaths := openapi3.Paths{}
	newPaths.Set("/pets", &openapi3.PathItem{
		Get: &openapi3.Operation{Responses: &openapi3.Responses{}},
	})

	sc := NewSchemaComparer()
	_, breaking, err := sc.Compare(
		makeSpec(oldPaths, nil),
		makeSpec(newPaths, nil),
	)
	require.NoError(t, err)

	found := false
	for _, bc := range breaking {
		if bc.Type == "endpoint_removed" && bc.Path == "/users" {
			found = true
		}
	}
	assert.True(t, found, "should detect removed endpoint; breaking=%v", breaking)
}

func TestSchemaComparer_MethodRemoved(t *testing.T) {
	oldPaths := openapi3.Paths{}
	oldPaths.Set("/pets/{id}", &openapi3.PathItem{
		Get:    &openapi3.Operation{Responses: &openapi3.Responses{}},
		Delete: &openapi3.Operation{Responses: &openapi3.Responses{}},
	})

	newPaths := openapi3.Paths{}
	newPaths.Set("/pets/{id}", &openapi3.PathItem{
		Get: &openapi3.Operation{Responses: &openapi3.Responses{}},
	})

	sc := NewSchemaComparer()
	_, breaking, err := sc.Compare(
		makeSpec(oldPaths, nil),
		makeSpec(newPaths, nil),
	)
	require.NoError(t, err)

	found := false
	for _, bc := range breaking {
		if bc.Type == "method_removed" && bc.Path == "/pets/{id}.DELETE" {
			found = true
		}
	}
	assert.True(t, found, "should detect removed DELETE method; breaking=%v", breaking)
}

func TestSchemaComparer_EndpointAdded(t *testing.T) {
	oldPaths := openapi3.Paths{}
	oldPaths.Set("/pets", &openapi3.PathItem{
		Get: &openapi3.Operation{Responses: &openapi3.Responses{}},
	})

	newPaths := openapi3.Paths{}
	newPaths.Set("/pets", &openapi3.PathItem{
		Get: &openapi3.Operation{Responses: &openapi3.Responses{}},
	})
	newPaths.Set("/health", &openapi3.PathItem{
		Get: &openapi3.Operation{Responses: &openapi3.Responses{}},
	})

	sc := NewSchemaComparer()
	diffs, breaking, err := sc.Compare(
		makeSpec(oldPaths, nil),
		makeSpec(newPaths, nil),
	)
	require.NoError(t, err)

	// Added endpoint should NOT be breaking
	for _, bc := range breaking {
		assert.NotContains(t, bc.Path, "/health", "new endpoint should not be breaking")
	}

	found := false
	for _, d := range diffs {
		if d.Type == DiffTypeAdded && d.Path == "/health" {
			found = true
			assert.Equal(t, SeverityInfo, d.Severity)
		}
	}
	assert.True(t, found, "should detect added endpoint; diffs=%v", diffs)
}

// ---------- Request body tests ----------

func TestSchemaComparer_RequestBodySchemaChanged(t *testing.T) {
	oldPaths := openapi3.Paths{}
	oldPaths.Set("/pets", &openapi3.PathItem{
		Post: &openapi3.Operation{
			RequestBody: &openapi3.RequestBodyRef{
				Value: &openapi3.RequestBody{
					Required: true,
					Content: openapi3.Content{
						"application/json": &openapi3.MediaType{
							Schema: &openapi3.SchemaRef{Value: &openapi3.Schema{
								Type:     makeType("object"),
								Required: []string{"name"},
								Properties: openapi3.Schemas{
									"name": &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
								},
							}},
						},
					},
				},
			},
			Responses: &openapi3.Responses{},
		},
	})

	newPaths := openapi3.Paths{}
	newPaths.Set("/pets", &openapi3.PathItem{
		Post: &openapi3.Operation{
			RequestBody: &openapi3.RequestBodyRef{
				Value: &openapi3.RequestBody{
					Required: true,
					Content: openapi3.Content{
						"application/json": &openapi3.MediaType{
							Schema: &openapi3.SchemaRef{Value: &openapi3.Schema{
								Type:     makeType("object"),
								Required: []string{"name", "species"},
								Properties: openapi3.Schemas{
									"name":    &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
									"species": &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
								},
							}},
						},
					},
				},
			},
			Responses: &openapi3.Responses{},
		},
	})

	sc := NewSchemaComparer()
	_, breaking, err := sc.Compare(
		makeSpec(oldPaths, nil),
		makeSpec(newPaths, nil),
	)
	require.NoError(t, err)

	found := false
	for _, bc := range breaking {
		if bc.Type == "required_field_added" {
			found = true
			assert.Contains(t, bc.Description, "species")
		}
	}
	assert.True(t, found, "should detect new required field in request body; breaking=%v", breaking)
}

// ---------- Response body tests ----------

func TestSchemaComparer_ResponseBodyTypeChanged(t *testing.T) {
	resp200Old := openapi3.Responses{}
	resp200Old.Set("200", &openapi3.ResponseRef{
		Value: &openapi3.Response{
			Description: strPtr("OK"),
			Content: openapi3.Content{
				"application/json": &openapi3.MediaType{
					Schema: &openapi3.SchemaRef{Value: &openapi3.Schema{
						Type: makeType("object"),
						Properties: openapi3.Schemas{
							"id": &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("integer")}},
						},
					}},
				},
			},
		},
	})

	resp200New := openapi3.Responses{}
	resp200New.Set("200", &openapi3.ResponseRef{
		Value: &openapi3.Response{
			Description: strPtr("OK"),
			Content: openapi3.Content{
				"application/json": &openapi3.MediaType{
					Schema: &openapi3.SchemaRef{Value: &openapi3.Schema{
						Type: makeType("object"),
						Properties: openapi3.Schemas{
							"id": &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
						},
					}},
				},
			},
		},
	})

	oldPaths := openapi3.Paths{}
	oldPaths.Set("/pets", &openapi3.PathItem{
		Get: &openapi3.Operation{Responses: &resp200Old},
	})

	newPaths := openapi3.Paths{}
	newPaths.Set("/pets", &openapi3.PathItem{
		Get: &openapi3.Operation{Responses: &resp200New},
	})

	sc := NewSchemaComparer()
	_, breaking, err := sc.Compare(
		makeSpec(oldPaths, nil),
		makeSpec(newPaths, nil),
	)
	require.NoError(t, err)

	found := false
	for _, bc := range breaking {
		if bc.Type == "type_changed" {
			found = true
			assert.Contains(t, bc.Description, "integer")
			assert.Contains(t, bc.Description, "string")
		}
	}
	assert.True(t, found, "should detect response body property type change; breaking=%v", breaking)
}

// ---------- No changes test ----------

func TestSchemaComparer_NoChanges(t *testing.T) {
	schemas := openapi3.Schemas{
		"Pet": &openapi3.SchemaRef{Value: &openapi3.Schema{
			Type:     makeType("object"),
			Required: []string{"id", "name"},
			Properties: openapi3.Schemas{
				"id":   &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("integer")}},
				"name": &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
			},
		}},
	}

	paths := openapi3.Paths{}
	paths.Set("/pets", &openapi3.PathItem{
		Get: &openapi3.Operation{Responses: &openapi3.Responses{}},
	})

	sc := NewSchemaComparer()
	diffs, breaking, err := sc.Compare(
		makeSpec(paths, schemas),
		makeSpec(paths, schemas),
	)
	require.NoError(t, err)
	assert.Empty(t, diffs, "identical specs should produce no diffs")
	assert.Empty(t, breaking, "identical specs should produce no breaking changes")
}

// ---------- Complex real-world scenario ----------

func TestSchemaComparer_ComplexRealWorld(t *testing.T) {
	// Simulates a real API evolution: Pet Store v1 → v2
	oldSchemas := openapi3.Schemas{
		"Pet": &openapi3.SchemaRef{Value: &openapi3.Schema{
			Type:     makeType("object"),
			Required: []string{"id", "name"},
			Properties: openapi3.Schemas{
				"id":   &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("integer")}},
				"name": &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
				"tag":  &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
				"status": &openapi3.SchemaRef{Value: &openapi3.Schema{
					Type: makeType("string"),
					Enum: []interface{}{"available", "pending", "sold"},
				}},
			},
		}},
	}

	newSchemas := openapi3.Schemas{
		"Pet": &openapi3.SchemaRef{Value: &openapi3.Schema{
			Type:     makeType("object"),
			Required: []string{"id", "name", "species"}, // species added as required
			Properties: openapi3.Schemas{
				"id":      &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}}, // changed type
				"name":    &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}},
				"species": &openapi3.SchemaRef{Value: &openapi3.Schema{Type: makeType("string")}}, // new required
				// "tag" removed
				"status": &openapi3.SchemaRef{Value: &openapi3.Schema{
					Type: makeType("string"),
					Enum: []interface{}{"available", "sold", "adopted"}, // "pending" removed, "adopted" added
				}},
			},
		}},
	}

	sc := NewSchemaComparer()
	diffs, breaking, err := sc.Compare(
		makeSpec(openapi3.Paths{}, oldSchemas),
		makeSpec(openapi3.Paths{}, newSchemas),
	)
	require.NoError(t, err)

	// Collect breaking change types found
	breakingTypes := make(map[string]bool)
	for _, bc := range breaking {
		breakingTypes[bc.Type] = true
	}

	assert.True(t, breakingTypes["type_changed"], "should detect id type changed (integer→string); breaking=%v", breaking)
	assert.True(t, breakingTypes["required_field_added"], "should detect species added as required; breaking=%v", breaking)
	assert.True(t, breakingTypes["property_removed"], "should detect tag removed; breaking=%v", breaking)
	assert.True(t, breakingTypes["enum_value_removed"], "should detect 'pending' enum value removed; breaking=%v", breaking)

	// Check that non-breaking changes are also detected
	diffTypes := make(map[DiffType]bool)
	for _, d := range diffs {
		diffTypes[d.Type] = true
	}

	assert.True(t, diffTypes[DiffTypeAdded], "should detect additions (species property, adopted enum); diffs=%v", diffs)
}
