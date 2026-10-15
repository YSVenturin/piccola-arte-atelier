package com.yuri.piccolaarte.controllers;

import com.yuri.piccolaarte.dtos.ProductImageRequestDTO;
import com.yuri.piccolaarte.dtos.ProductImageResponseDTO;
import com.yuri.piccolaarte.services.ProductImageService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/admin/products/{productId}/images")
public class ProductImageController {

    private final ProductImageService productImageService;

    public ProductImageController(ProductImageService productImageService) {
        this.productImageService = productImageService;
    }

    @GetMapping
    public ResponseEntity<List<ProductImageResponseDTO>> findAll(@PathVariable Long productId) {
        return ResponseEntity.ok(
                productImageService.findAllByProductId(productId)
        );
    }

    @GetMapping("/{imageId}")
    public ResponseEntity<ProductImageResponseDTO> findById(@PathVariable Long productId, @PathVariable Long imageId) {
        return ResponseEntity.ok(
                productImageService.findByIdAndProductId(
                        imageId,
                        productId
                )
        );
    }

    @PostMapping
    public ResponseEntity<ProductImageResponseDTO> create(@PathVariable Long productId, @Valid @RequestBody ProductImageRequestDTO request) {
        ProductImageResponseDTO image = productImageService.create(
                productId,
                request
        );

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{imageId}")
                .buildAndExpand(image.id())
                .toUri();

        return ResponseEntity.created(location).body(image);
    }

    @PutMapping("/{imageId}")
    public ResponseEntity<ProductImageResponseDTO> update(@PathVariable Long productId, @PathVariable Long imageId, @Valid @RequestBody ProductImageRequestDTO request) {
        ProductImageResponseDTO image = productImageService.update(
                productId,
                imageId,
                request
        );

        return ResponseEntity.ok(image);
    }

    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> delete(@PathVariable Long productId, @PathVariable Long imageId) {
        productImageService.delete(productId, imageId);

        return ResponseEntity.noContent().build();
    }
}