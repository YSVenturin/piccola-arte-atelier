package com.yuri.piccolaarte.services;

import com.yuri.piccolaarte.entities.ProductImage;
import com.yuri.piccolaarte.repositories.ProductImageRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductImageService {

    private final ProductImageRepository productImageRepository;

    public ProductImageService(ProductImageRepository productImageRepository) {
        this.productImageRepository = productImageRepository;
    }

    public List<ProductImage> findAllByProductId(Long id) {
        return productImageRepository.findByProductIdOrderByDisplayOrderAsc(id);
    }

    public ProductImage findByIdAndProductId(Long imageId, Long productId) {
        Optional<ProductImage> productImage = productImageRepository.findByIdAndProductId(imageId, productId);
        return productImage.get();
    }
}
