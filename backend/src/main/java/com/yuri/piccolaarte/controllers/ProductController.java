package com.yuri.piccolaarte.controllers;

import com.yuri.piccolaarte.entities.Product;
import com.yuri.piccolaarte.services.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(value = "/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<List<Product>> findAll() {
        List<Product> products = productService.findAll();
        return ResponseEntity.ok().body(products);
    }

    @GetMapping("/{slug}")
    public ResponseEntity<Product> findBySlug(@PathVariable String slug) {
        Product product = productService.findBySlug(slug);
        return ResponseEntity.ok(product);
    }
}
