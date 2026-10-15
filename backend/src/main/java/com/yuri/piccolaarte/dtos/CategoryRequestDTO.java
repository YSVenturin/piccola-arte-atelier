package com.yuri.piccolaarte.dtos;

import jakarta.validation.constraints.*;

public record CategoryRequestDTO(
        @NotBlank(message = "Name is required.")
        @Size(max = 80, message = "Name must contain at most 80 characters.")
        String name,

        @NotBlank(message = "Slug is required.")
        @Size(max = 100, message = "Slug must contain at most 100 characters.")
        @Pattern(
                regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                message = "Slug must contain lowercase letters, numbers and single hyphens between words."
        )
        String slug,

        @Size(
                max = 2000,
                message = "Description must contain at most 2000 characters."
        )
        String description,

        @NotNull(message = "Active status is required.")
        Boolean active,

        @NotNull(message = "Display order is required.")
        @PositiveOrZero(message = "Display order must be zero or greater.")
        Integer displayOrder
) {
}
