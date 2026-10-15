package com.yuri.piccolaarte.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Set;

public record ProductRequestDTO (
        @NotBlank(message = "Name is required.")
        @Size(max = 120, message = "Name must contain at most 120 characters.")
        String name,

        @NotBlank(message = "Slug is required.")
        @Size(max = 140, message = "Slug must contain at most 140 characters.")
        @Pattern(
                regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                message = "Slug must contain lowercase letters, numbers and single hyphens between words."
        )
        String slug,

        @Size(
                max = 200,
                message = "Short description must contain at most 200 characters."
        )
        String shortDescription,

        @Size(
                max = 10000,
                message = "Description must contain at most 10000 characters."
        )
        String description,

        @DecimalMin(
                value = "0.00",
                message = "Price must be zero or greater."
        )
        @Digits(
                integer = 8,
                fraction = 2,
                message = "Price must have at most 8 integer digits and 2 decimal places."
        )
        BigDecimal price,

        @NotNull(message = "Price visibility is required.")
        Boolean priceVisible,

        @NotNull(message = "Featured status is required.")
        Boolean featured,

        @Size(max = 80, message = "Material must contain at most 80 characters.")
        String material,

        @Size(
                max = 120,
                message = "Dimensions must contain at most 120 characters."
        )
        String dimensions,

        @NotNull(message = "Active status is required.")
        Boolean active,

        @NotNull(message = "Availability is required.")
        Boolean available,

        @NotNull(message = "Made-to-order status is required.")
        Boolean madeToOrder,

        @NotNull(message = "Category IDs are required.")
        Set<
                @NotNull(message = "Category ID must not be null.")
                @Positive(message = "Category ID must be greater than zero.")
                        Long
                > categoryIds
) {
}
