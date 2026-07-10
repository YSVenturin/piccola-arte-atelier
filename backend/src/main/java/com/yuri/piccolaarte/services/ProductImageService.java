package com.yuri.piccolaarte.services;

import com.yuri.piccolaarte.dtos.ProductImageResponseDTO;
import com.yuri.piccolaarte.entities.ProductImage;
import com.yuri.piccolaarte.repositories.ProductImageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProductImageService {

    private final ProductImageRepository productImageRepository;

    public ProductImageService(ProductImageRepository productImageRepository) {
        this.productImageRepository = productImageRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductImageResponseDTO> findAllByProductId(Long id) {
        return productImageRepository.findByProductIdOrderByDisplayOrderAsc(id).stream().map(ProductImageResponseDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public ProductImageResponseDTO findByIdAndProductId(Long imageId, Long productId) {
        Optional<ProductImage> productImage = productImageRepository.findByIdAndProductId(imageId, productId);
        if (productImage.isEmpty()) {
            throw new RuntimeException("Image not found");
        }

        return new ProductImageResponseDTO(productImage.get());
    }
}
