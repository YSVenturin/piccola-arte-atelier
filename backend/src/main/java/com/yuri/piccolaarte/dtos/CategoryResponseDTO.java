package com.yuri.piccolaarte.dtos;

import com.yuri.piccolaarte.entities.Category;

public record CategoryResponseDTO(
        Long id,
        String name,
        String slug,
        String description
) {
    public CategoryResponseDTO(Category category) {
        this(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription()
        );
    }
}
