package com.yuri.piccolaarte.services;

import com.yuri.piccolaarte.dtos.ProductImageResponseDTO;
import com.yuri.piccolaarte.entities.ProductImage;
import com.yuri.piccolaarte.exceptions.ResourceNotFoundException;
import com.yuri.piccolaarte.repositories.ProductImageRepository;
import com.yuri.piccolaarte.repositories.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProductImageService {

    private final ProductImageRepository productImageRepository;
    private final ProductRepository productRepository;

    public ProductImageService(ProductImageRepository productImageRepository, ProductRepository productRepository) {
        this.productImageRepository = productImageRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductImageResponseDTO> findAllByProductId(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found.");
        }
        return productImageRepository.findByProductIdOrderByDisplayOrderAsc(id).stream().map(ProductImageResponseDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public ProductImageResponseDTO findByIdAndProductId(Long imageId, Long productId) {
        ProductImage image = productImageRepository
                .findByIdAndProductId(imageId, productId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Image not found for this product.")
                );

        return new ProductImageResponseDTO(image);
    }
}
