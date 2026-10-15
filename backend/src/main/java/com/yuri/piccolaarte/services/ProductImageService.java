package com.yuri.piccolaarte.services;

import com.yuri.piccolaarte.dtos.ProductImageRequestDTO;
import com.yuri.piccolaarte.dtos.ProductImageResponseDTO;
import com.yuri.piccolaarte.entities.Product;
import com.yuri.piccolaarte.entities.ProductImage;
import com.yuri.piccolaarte.exceptions.InvalidRequestException;
import com.yuri.piccolaarte.exceptions.ResourceNotFoundException;
import com.yuri.piccolaarte.repositories.ProductImageRepository;
import com.yuri.piccolaarte.repositories.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.util.Arrays;
import java.util.List;

@Service
public class ProductImageService {

    private final ProductImageRepository productImageRepository;
    private final ProductRepository productRepository;

    public ProductImageService(ProductImageRepository productImageRepository, ProductRepository productRepository) {
        this.productImageRepository = productImageRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductImageResponseDTO> findAllByProductId(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found.");
        }

        return productImageRepository
                .findByProductIdOrderByDisplayOrderAscIdAsc(productId)
                .stream()
                .map(ProductImageResponseDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductImageResponseDTO findByIdAndProductId(Long imageId, Long productId) {
        ProductImage image = findImage(imageId, productId);

        return new ProductImageResponseDTO(image);
    }

    @Transactional
    public ProductImageResponseDTO create(Long productId, ProductImageRequestDTO request) {
        validateUrl(request.url());

        Product product = findProductForUpdate(productId);

        if (Boolean.TRUE.equals(request.mainImage())) {
            clearMainImages(product);
        }

        ProductImage image = new ProductImage();
        copyRequestToEntity(request, image);

        product.addImage(image);

        ProductImage savedImage = productImageRepository.saveAndFlush(
                image
        );

        return new ProductImageResponseDTO(savedImage);
    }

    @Transactional
    public ProductImageResponseDTO update(Long productId, Long imageId, ProductImageRequestDTO request) {
        Product product = findProductForUpdate(productId);
        ProductImage image = findImage(imageId, productId);

        validateUrl(request.url());

        if (Boolean.TRUE.equals(request.mainImage())) {
            clearMainImages(product);
        }

        copyRequestToEntity(request, image);

        ProductImage savedImage = productImageRepository.saveAndFlush(
                image
        );

        return new ProductImageResponseDTO(savedImage);
    }

    @Transactional
    public void delete(Long productId, Long imageId) {
        Product product = findProductForUpdate(productId);
        ProductImage image = findImage(imageId, productId);

        product.removeImage(image);

        productRepository.flush();
    }

    private Product findProductForUpdate(Long productId) {
        return productRepository.findByIdForUpdate(productId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Product not found.")
                );
    }

    private ProductImage findImage(Long imageId, Long productId) {
        return productImageRepository
                .findByIdAndProductId(imageId, productId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Image not found for this product."
                        )
                );
    }

    private void clearMainImages(Product product) {
        for (ProductImage image : product.getProductImages()) {
            if (Boolean.TRUE.equals(image.getMainImage())) {
                image.setMainImage(false);
            }
        }

        productImageRepository.flush();
    }

    private void copyRequestToEntity(
            ProductImageRequestDTO request,
            ProductImage image
    ) {
        image.setUrl(request.url());

        image.setAltText(
                request.altText() == null || request.altText().isBlank()
                        ? null
                        : request.altText().strip()
        );

        image.setMainImage(request.mainImage());
        image.setDisplayOrder(request.displayOrder());
    }

    private void validateUrl(String value) {
        URI uri;

        try {
            uri = URI.create(value);
        } catch (IllegalArgumentException exception) {
            throw new InvalidRequestException("Invalid image URL.");
        }

        boolean httpUrl =
                ("http".equalsIgnoreCase(uri.getScheme())
                        || "https".equalsIgnoreCase(uri.getScheme()))
                        && uri.getHost() != null
                        && uri.getRawUserInfo() == null;

        String path = uri.getPath();

        boolean localPath =
                uri.getScheme() == null
                        && uri.getRawAuthority() == null
                        && path != null
                        && path.startsWith("/images/")
                        && !path.contains("\\")
                        && Arrays.stream(path.split("/"))
                        .noneMatch(".."::equals);

        if (!httpUrl && !localPath) {
            throw new InvalidRequestException(
                    "Image URL must be an HTTP(S) address or a path under /images/."
            );
        }
    }
}