package com.yuri.piccolaarte.controllers;

import com.yuri.piccolaarte.dtos.CategoryResponseDTO;
import com.yuri.piccolaarte.services.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(value = "/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponseDTO>> findAll() {
        List<CategoryResponseDTO> categories = categoryService.findAll();
        return ResponseEntity.ok().body(categories);
    }

    @GetMapping(value = "/{slug}")
    public ResponseEntity<CategoryResponseDTO> findBySlug(@PathVariable String slug) {
        CategoryResponseDTO category = categoryService.findBySlug(slug);
        return ResponseEntity.ok().body(category);
    }
}
