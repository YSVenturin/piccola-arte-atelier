package com.yuri.piccolaarte.dtos;

import com.yuri.piccolaarte.entities.ProductImage;

public record ProductImageResponseDTO(
        Long id,
        String url,
        String altText,
        Boolean mainImage,
        Integer displayOrder
) {
    public ProductImageResponseDTO(ProductImage productImage) {
        this(
                productImage.getId(),
                productImage.getUrl(),
                productImage.getAltText(),
                productImage.getMainImage(),
                productImage.getDisplayOrder()
        );
    }
}
