package com.yuri.piccolaarte.dtos;

import com.yuri.piccolaarte.entities.Product;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ProductDetailsDTO(
        Long id,
        String name,
        String slug,
        String shortDescription,
        String description,
        BigDecimal price,
        Boolean priceVisible,
        Boolean featured,
        String material,
        String dimensions,
        Boolean active,
        Boolean available,
        Boolean madeToOrder,
        List<CategoryResponseDTO> categories,
        List<ProductImageResponseDTO> images,
        Instant createdAt,
        Instant updatedAt
) {
    public ProductDetailsDTO(Product product) {
        this(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getShortDescription(),
                product.getDescription(),
                product.getPrice(),
                product.getPriceVisible(),
                product.getFeatured(),
                product.getMaterial(),
                product.getDimensions(),
                product.getActive(),
                product.getAvailable(),
                product.getMadeToOrder(),
                product.getCategories()
                        .stream()
                        .map(CategoryResponseDTO::new)
                        .toList(),
                product.getProductImages()
                        .stream()
                        .map(ProductImageResponseDTO::new)
                        .toList(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
