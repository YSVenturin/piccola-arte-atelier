package com.yuri.piccolaarte.dtos;

import com.yuri.piccolaarte.entities.Product;

import java.math.BigDecimal;
import java.util.List;

public record ProductSummaryDTO(
        Long id,
        String name,
        String slug,
        String shortDescription,
        BigDecimal price,
        Boolean priceVisible,
        Boolean featured,
        Boolean active,
        Boolean available,
        Boolean madeToOrder,
        ProductImageResponseDTO mainImage,
        List<CategoryResponseDTO> categories
) {
    public ProductSummaryDTO(Product product) {
        this(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getShortDescription(),
                product.getPrice(),
                product.getPriceVisible(),
                product.getFeatured(),
                product.getActive(),
                product.getAvailable(),
                product.getMadeToOrder(),
                getMainImage(product),
                product.getCategories().stream().map(CategoryResponseDTO::new).toList()
        );
    }

    private static ProductImageResponseDTO getMainImage(Product product) {
        return product.getProductImages().stream().filter(image -> Boolean.TRUE.equals(image.getMainImage()))
                .findFirst().map(ProductImageResponseDTO::new).orElse(null);
    }
}
