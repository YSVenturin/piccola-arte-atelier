package com.yuri.piccolaarte.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record ProductImageRequestDTO(

        @NotBlank(message = "Image URL is required.")
        @Size(
                max = 1000,
                message = "Image URL must contain at most 1000 characters."
        )
        String url,

        @Size(
                max = 200,
                message = "Alternative text must contain at most 200 characters."
        )
        String altText,

        @NotNull(message = "Main image status is required.")
        Boolean mainImage,

        @NotNull(message = "Display order is required.")
        @PositiveOrZero(message = "Display order must be zero or greater.")
        Integer displayOrder

) {
}