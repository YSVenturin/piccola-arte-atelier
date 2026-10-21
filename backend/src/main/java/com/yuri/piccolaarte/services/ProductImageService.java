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

import com.yuri.piccolaarte.dtos.ProductImageOrderDTO;
import com.yuri.piccolaarte.storage.ImageStorageService;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.util.Comparator;
import java.util.HashSet;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProductImageService {

    private final ProductImageRepository productImageRepository;
    private final ProductRepository productRepository;
    private final ImageStorageService imageStorage;

    public ProductImageService(ProductImageRepository productImageRepository, ProductRepository productRepository, ImageStorageService imageStorage) {
        this.productImageRepository = productImageRepository;
        this.productRepository = productRepository;
        this.imageStorage = imageStorage;
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

        validateImageLimit(product);

        if (Boolean.TRUE.equals(request.mainImage())) {
            clearMainImages(product);
        }

        ProductImage image = new ProductImage();
        copyRequestToEntity(request, image);

        product.addImage(image);
        ensureMainImage(product);

        ProductImage savedImage = productImageRepository.saveAndFlush(
                image
        );

        return new ProductImageResponseDTO(savedImage);
    }

    @Transactional
    public ProductImageResponseDTO update(
            Long productId,
            Long imageId,
            ProductImageRequestDTO request
    ) {
        Product product = findProductForUpdate(productId);
        ProductImage image = findImage(imageId, productId);

        validateUrl(request.url());

        if (Boolean.TRUE.equals(request.mainImage())) {
            clearMainImages(product);
        }

        String previousUrl = image.getUrl();

        copyRequestToEntity(request, image);
        ensureMainImage(product);

        if (!java.util.Objects.equals(previousUrl, request.url())) {
            imageStorage.deleteAfterCommit(previousUrl);
        }

        ProductImage savedImage =
                productImageRepository.saveAndFlush(image);

        return new ProductImageResponseDTO(savedImage);
    }

    @Transactional
    public void delete(Long productId, Long imageId) {
        Product product = findProductForUpdate(productId);
        ProductImage image = findImage(imageId, productId);

        String url = image.getUrl();

        product.removeImage(image);

        normalizeOrder(product);
        ensureMainImage(product);

        productRepository.flush();

        imageStorage.deleteAfterCommit(url);
    }

    private Product findProductForUpdate(Long productId) {
        return productRepository.findByIdForUpdate(productId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Product not found.")
                );
    }

    private void validateImageLimit(Product product) {
        if (product.getProductImages().size() >= 20) {
            throw new InvalidRequestException(
                    "A product may have at most 20 images."
            );
        }
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

    @Transactional
    public ProductImageResponseDTO upload(
            Long productId,
            MultipartFile file,
            String altText
    ) {
        Product product = findProductForUpdate(productId);

        validateImageLimit(product);

        if (altText != null && altText.length() > 200) {
            throw new InvalidRequestException(
                    "Alternative text must contain at most 200 characters."
            );
        }

        String url = imageStorage.store(file);

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCompletion(int status) {
                        if (status == STATUS_ROLLED_BACK) {
                            imageStorage.delete(url);
                        }
                    }
                }
        );

        normalizeOrder(product);

        ProductImage image = new ProductImage();

        image.setUrl(url);

        image.setAltText(
                altText == null || altText.isBlank()
                        ? null
                        : altText.strip()
        );

        image.setDisplayOrder(product.getProductImages().size());
        image.setMainImage(false);

        product.addImage(image);
        ensureMainImage(product);

        return new ProductImageResponseDTO(
                productImageRepository.saveAndFlush(image)
        );
    }

    @Transactional
    public List<ProductImageResponseDTO> reorder(
            Long productId,
            ProductImageOrderDTO request
    ) {
        Product product = findProductForUpdate(productId);

        Map<Long, ProductImage> images =
                product.getProductImages()
                        .stream()
                        .collect(Collectors.toMap(
                                ProductImage::getId,
                                Function.identity()
                        ));

        if (request.imageIds().size() != images.size()
                || new HashSet<>(request.imageIds()).size() != images.size()
                || !images.keySet().containsAll(request.imageIds())) {
            throw new InvalidRequestException(
                    "Image order must contain every image of this product exactly once."
            );
        }

        for (int index = 0; index < request.imageIds().size(); index++) {
            Long imageId = request.imageIds().get(index);
            images.get(imageId).setDisplayOrder(index);
        }

        productImageRepository.flush();

        return request.imageIds()
                .stream()
                .map(id -> new ProductImageResponseDTO(images.get(id)))
                .toList();
    }

    private void normalizeOrder(Product product) {
        List<ProductImage> images = sortedImages(product);

        for (int index = 0; index < images.size(); index++) {
            images.get(index).setDisplayOrder(index);
        }
    }

    private void ensureMainImage(Product product) {
        List<ProductImage> images = sortedImages(product);

        boolean hasMainImage = images.stream()
                .anyMatch(image -> Boolean.TRUE.equals(image.getMainImage()));

        if (!images.isEmpty() && !hasMainImage) {
            images.get(0).setMainImage(true);
        }
    }

    private List<ProductImage> sortedImages(Product product) {
        return product.getProductImages()
                .stream()
                .sorted(
                        Comparator.comparing(ProductImage::getDisplayOrder)
                                .thenComparing(
                                        ProductImage::getId,
                                        Comparator.nullsLast(
                                                Comparator.naturalOrder()
                                        )
                                )
                )
                .toList();
    }
}
