package com.yuri.piccolaarte.controllers;

import com.yuri.piccolaarte.entities.ProductImage;
import com.yuri.piccolaarte.services.ProductImageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(value = "/api/admin/products/{productId}/images")
public class ProductImageController {

    private final ProductImageService productImageService;

    public ProductImageController(ProductImageService productImageService) {
        this.productImageService = productImageService;
    }

    @GetMapping
    public ResponseEntity<List<ProductImage>> findAllByProductId(@PathVariable Long productId) {
        List<ProductImage> productImages = productImageService.findAllByProductId(productId);
        return ResponseEntity.ok().body(productImages);
    }

    @GetMapping(value = "/{imageId}")
    public ResponseEntity<ProductImage> findById(@PathVariable Long imageId, @PathVariable Long productId) {
        ProductImage productImage = productImageService.findByIdAndProductId(imageId, productId);
        return ResponseEntity.ok().body(productImage);
    }
}
