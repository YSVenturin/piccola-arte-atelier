package com.yuri.piccolaarte.services;

import com.yuri.piccolaarte.dtos.ProductDetailsDTO;
import com.yuri.piccolaarte.dtos.ProductSummaryDTO;
import com.yuri.piccolaarte.entities.Product;
import com.yuri.piccolaarte.repositories.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductSummaryDTO> findAll(String categorySlug) {
        List<Product> products;

        if (categorySlug == null || categorySlug.isBlank()) {
            products = productRepository.findByActiveTrueOrderByCreatedAtDesc();
        }
        else {
            String normalizedCategorySlug = categorySlug.trim().toLowerCase(Locale.ROOT);
            products = productRepository.findActiveByCategorySlug(normalizedCategorySlug);
        }

        return products.stream().map(ProductSummaryDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public ProductDetailsDTO findBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        return new ProductDetailsDTO(product);
    }
}
