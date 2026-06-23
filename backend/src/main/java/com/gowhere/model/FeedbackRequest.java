package com.gowhere.model;

import jakarta.validation.constraints.NotBlank;

public record FeedbackRequest(@NotBlank String recordId, String planId, @NotBlank String type, String content) {}
