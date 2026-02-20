package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/tvc-org/tvc/internal/api/request"
	"github.com/tvc-org/tvc/internal/api/response"
	"github.com/tvc-org/tvc/internal/models"
	"github.com/tvc-org/tvc/internal/storage"
	"github.com/tvc-org/tvc/pkg/logger"
)

type OrganizationHandler struct {
	store storage.Repository
	log   *logger.Logger
}

func NewOrganizationHandler(store storage.Repository, log *logger.Logger) *OrganizationHandler {
	return &OrganizationHandler{store: store, log: log}
}

type createOrgRequest struct {
	Name string `json:"name"`
	Slug string `json:"slug,omitempty"`
}

func (h *OrganizationHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createOrgRequest
	if err := request.ParseJSON(r, 0, &req); err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	if req.Name == "" || len(req.Name) > 255 {
		response.ValidationError(w, []response.FieldError{
			{Field: "name", Message: "Name is required (1-255 characters)"},
		})
		return
	}

	if req.Slug == "" {
		req.Slug = generateSlug(req.Name)
	}
	if !slugPattern.MatchString(req.Slug) {
		response.ValidationError(w, []response.FieldError{
			{Field: "slug", Message: "Slug must be lowercase alphanumeric with dashes"},
		})
		return
	}

	org := &models.Organization{
		ID:        uuid.New(),
		Name:      req.Name,
		Slug:      req.Slug,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.store.CreateOrganization(r.Context(), org); err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			response.Conflict(w, "An organization with this slug already exists")
			return
		}
		h.log.Error().Err(err).Msg("failed to create organization")
		response.InternalError(w)
		return
	}

	response.Created(w, org)
}

func (h *OrganizationHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := request.PathUUID(r, "id")
	if err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	org, err := h.store.GetOrganization(r.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.NotFound(w, "Organization")
			return
		}
		h.log.Error().Err(err).Msg("failed to get organization")
		response.InternalError(w)
		return
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"data": org,
	})
}

func (h *OrganizationHandler) List(w http.ResponseWriter, r *http.Request) {
	// For now, this would need the user's orgs from auth context
	// Placeholder: returns empty list until org membership is wired
	response.JSON(w, http.StatusOK, map[string]interface{}{
		"data": []models.Organization{},
	})
}
