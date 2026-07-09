package com.yuri.piccolaarte.services;

import com.yuri.piccolaarte.dtos.CategoryResponseDTO;
import com.yuri.piccolaarte.entities.Category;
import com.yuri.piccolaarte.repositories.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponseDTO> findAll() {
        return categoryRepository.findByActiveTrueOrderByDisplayOrderAsc().stream().map(CategoryResponseDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponseDTO findBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        return new CategoryResponseDTO(category);
    }
}
