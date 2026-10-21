package com.yuri.piccolaarte.storage;

import com.yuri.piccolaarte.exceptions.ImageStorageException;
import com.yuri.piccolaarte.exceptions.InvalidRequestException;
import com.yuri.piccolaarte.repositories.ProductImageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;

@Service
public class LocalImageStorageService implements ImageStorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalImageStorageService.class);

    private static final String URL_PREFIX = "/images/uploads/";

    private final Path root;
    private final ProductImageRepository imageRepository;

    public LocalImageStorageService(@Value("${app.storage.upload-dir}") String directory, ProductImageRepository imageRepository) {
        this.root = Path.of(directory).toAbsolutePath().normalize();
        this.imageRepository = imageRepository;

        try {
            Files.createDirectories(root);
        } catch (IOException exception) {
            throw new ImageStorageException("Could not initialize image storage.", exception);
        }
    }

    public String getResourceLocation() {
        String location = root.toUri().toString();
        return location.endsWith("/") ? location : location + "/";
    }

    @Override
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("An image file is required.");
        }

        if (file.getSize() > 5L * 1024 * 1024) {
            throw new InvalidRequestException("Image file must not exceed 5 MiB.");
        }

        String extension = validateImage(file);
        String filename = UUID.randomUUID() + "." + extension;
        Path target = root.resolve(filename);
        boolean created = false;

        try (InputStream input = file.getInputStream()) {
            try (OutputStream output = Files.newOutputStream(target, StandardOpenOption.CREATE_NEW)) {
                created = true;
                input.transferTo(output);
            }

            return URL_PREFIX + filename;
        } catch (IOException exception) {
            if (created) {
                delete(URL_PREFIX + filename);
            }

            throw new ImageStorageException("Could not store image.", exception);
        }
    }

    private String validateImage(MultipartFile file) {
        try (InputStream input = file.getInputStream(); ImageInputStream imageInput = ImageIO.createImageInputStream(input)) {
            if (imageInput == null) {
                throw new InvalidRequestException("Invalid image file.");
            }

            Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInput);

            if (!readers.hasNext()) {
                throw new InvalidRequestException("Only JPEG and PNG images are supported.");
            }

            ImageReader reader = readers.next();

            try {
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);

                if (!format.equals("jpeg")
                        && !format.equals("jpg")
                        && !format.equals("png")) {
                    throw new InvalidRequestException("Only JPEG and PNG images are supported.");
                }

                reader.setInput(imageInput, true, true);

                int width = reader.getWidth(0);
                int height = reader.getHeight(0);

                if (width < 1
                        || height < 1
                        || (long) width * height > 20_000_000) {
                    throw new InvalidRequestException("Image must not exceed 20 megapixels.");
                }

                var parameters = reader.getDefaultReadParam();

                int sample = Math.max(1, (Math.max(width, height) + 1599) / 1600);

                parameters.setSourceSubsampling(sample, sample, 0, 0);

                BufferedImage decoded = reader.read(0, parameters);

                if (decoded == null) {
                    throw new InvalidRequestException("Invalid image file.");
                }

                decoded.flush();

                return format.equals("png") ? "png" : "jpg";
            } finally {
                reader.dispose();
            }
        } catch (IOException exception) {
            throw new InvalidRequestException("Invalid image file.");
        }
    }

    @Override
    public void delete(String url) {
        if (url == null || !url.startsWith(URL_PREFIX)) {
            return;
        }

        String filename = url.substring(URL_PREFIX.length());

        if (!filename.matches(
                "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-"
                        + "[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png)"
        )) {
            return;
        }

        try {
            Files.deleteIfExists(root.resolve(filename));
        } catch (IOException exception) {
            log.error(
                    "Could not delete stored image {}",
                    filename,
                    exception
            );
        }
    }

    @Override
    public void deleteAfterCommit(String url) {
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        try {
                            if (!imageRepository.existsByUrl(url)) {
                                delete(url);
                            }
                        } catch (RuntimeException exception) {
                            log.error(
                                    "Could not clean up image after transaction commit.",
                                    exception
                            );
                        }
                    }
                }
        );
    }
}