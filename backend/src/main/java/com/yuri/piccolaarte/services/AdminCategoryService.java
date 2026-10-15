package com.yuri.piccolaarte.services;

import com.yuri.piccolaarte.dtos.CategoryRequestDTO;
import com.yuri.piccolaarte.dtos.CategoryResponseDTO;
import com.yuri.piccolaarte.entities.Category;
import com.yuri.piccolaarte.exceptions.ResourceConflictException;
import com.yuri.piccolaarte.exceptions.ResourceNotFoundException;
import com.yuri.piccolaarte.repositories.CategoryRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminCategoryService {

    private final CategoryRepository categoryRepository;

    public AdminCategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponseDTO> findAll() {
        Sort sort = Sort.by(
                Sort.Order.asc("displayOrder"),
                Sort.Order.asc("id")
        );

        return categoryRepository.findAll(sort)
                .stream()
                .map(CategoryResponseDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponseDTO findById(Long id) {
        Category category = findCategory(id);

        return new CategoryResponseDTO(category);
    }

    @Transactional
    public CategoryResponseDTO create(CategoryRequestDTO request) {
        validateSlug(request.slug(), null);

        Category category = new Category();
        copyRequestToEntity(request, category);

        Category savedCategory = categoryRepository.saveAndFlush(category);

        return new CategoryResponseDTO(savedCategory);
    }

    @Transactional
    public CategoryResponseDTO update(Long id, CategoryRequestDTO request) {
        Category category = findCategory(id);

        validateSlug(request.slug(), id);
        copyRequestToEntity(request, category);

        Category savedCategory = categoryRepository.saveAndFlush(category);

        return new CategoryResponseDTO(savedCategory);
    }

    @Transactional
    public void delete(Long id) {
        Category category = findCategory(id);

        if (!category.getProducts().isEmpty()) {
            throw new ResourceConflictException(
                    "Category cannot be deleted because it has associated products. Deactivate it instead."
            );
        }

        categoryRepository.delete(category);
        categoryRepository.flush();
    }

    private Category findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Category not found.")
                );
    }

    private void validateSlug(String slug, Long categoryId) {
        boolean slugExists;

        if (categoryId == null) {
            slugExists = categoryRepository.existsBySlug(slug);
        } else {
            slugExists = categoryRepository.existsBySlugAndIdNot(
                    slug,
                    categoryId
            );
        }

        if (slugExists) {
            throw new ResourceConflictException(
                    "A category with this slug already exists."
            );
        }
    }

    private void copyRequestToEntity(CategoryRequestDTO request, Category category) {
        category.setName(request.name().strip());
        category.setSlug(request.slug());

        category.setDescription(
                request.description() == null
                        ? null
                        : request.description().strip()
        );

        category.setActive(request.active());
        category.setDisplayOrder(request.displayOrder());
    }
}