package com.yuri.piccolaarte.services;

import com.yuri.piccolaarte.dtos.AdminProductResponseDTO;
import com.yuri.piccolaarte.dtos.ProductRequestDTO;
import com.yuri.piccolaarte.entities.Category;
import com.yuri.piccolaarte.entities.Product;
import com.yuri.piccolaarte.exceptions.InvalidRequestException;
import com.yuri.piccolaarte.exceptions.ResourceConflictException;
import com.yuri.piccolaarte.exceptions.ResourceNotFoundException;
import com.yuri.piccolaarte.repositories.CategoryRepository;
import com.yuri.piccolaarte.repositories.ProductRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class AdminProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public AdminProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminProductResponseDTO> findAll() {
        Sort sort = Sort.by(
                Sort.Order.desc("createdAt"),
                Sort.Order.desc("id")
        );

        return productRepository.findAll(sort)
                .stream()
                .map(AdminProductResponseDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminProductResponseDTO findById(Long id) {
        Product product = findProduct(id);

        return new AdminProductResponseDTO(product);
    }

    @Transactional
    public AdminProductResponseDTO create(ProductRequestDTO request) {
        validatePriceVisibility(request);
        validateSlug(request.slug(), null);

        List<Category> categories = findCategories(request.categoryIds());

        Product product = new Product();
        copyRequestToEntity(request, product, categories);

        Product savedProduct = productRepository.saveAndFlush(product);

        return new AdminProductResponseDTO(savedProduct);
    }

    @Transactional
    public AdminProductResponseDTO update(Long id, ProductRequestDTO request) {
        Product product = findProduct(id);

        validatePriceVisibility(request);
        validateSlug(request.slug(), id);

        List<Category> categories = findCategories(request.categoryIds());

        copyRequestToEntity(request, product, categories);

        Product savedProduct = productRepository.saveAndFlush(product);

        return new AdminProductResponseDTO(savedProduct);
    }

    @Transactional
    public void delete(Long id) {
        Product product = productRepository.findByIdForUpdate(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Product not found.")
                );

        productRepository.delete(product);
        productRepository.flush();
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Product not found.")
                );
    }

    private void validatePriceVisibility(ProductRequestDTO request) {
        if (Boolean.TRUE.equals(request.priceVisible())
                && request.price() == null) {
            throw new InvalidRequestException(
                    "Price is required when price visibility is enabled."
            );
        }
    }

    private void validateSlug(String slug, Long productId) {
        boolean slugExists;

        if (productId == null) {
            slugExists = productRepository.existsBySlug(slug);
        } else {
            slugExists = productRepository.existsBySlugAndIdNot(
                    slug,
                    productId
            );
        }

        if (slugExists) {
            throw new ResourceConflictException(
                    "A product with this slug already exists."
            );
        }
    }

    private List<Category> findCategories(Set<Long> categoryIds) {
        List<Category> categories = categoryRepository.findAllById(
                categoryIds
        );

        if (categories.size() != categoryIds.size()) {
            throw new InvalidRequestException(
                    "One or more category IDs do not exist."
            );
        }

        return categories;
    }

    private void copyRequestToEntity(
            ProductRequestDTO request,
            Product product,
            List<Category> categories
    ) {
        product.setName(request.name().strip());
        product.setSlug(request.slug());

        product.setShortDescription(
                normalizeOptionalText(request.shortDescription())
        );

        product.setDescription(
                normalizeOptionalText(request.description())
        );

        product.setPrice(request.price());
        product.setPriceVisible(request.priceVisible());
        product.setFeatured(request.featured());

        product.setMaterial(
                normalizeOptionalText(request.material())
        );

        product.setDimensions(
                normalizeOptionalText(request.dimensions())
        );

        product.setActive(request.active());
        product.setAvailable(request.available());
        product.setMadeToOrder(request.madeToOrder());

        product.getCategories().clear();
        product.getCategories().addAll(categories);
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.strip();
    }
}