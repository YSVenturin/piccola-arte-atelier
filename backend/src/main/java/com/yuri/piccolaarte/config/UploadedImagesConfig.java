package com.yuri.piccolaarte.config;

import com.yuri.piccolaarte.storage.LocalImageStorageService;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Duration;

@Configuration
public class UploadedImagesConfig implements WebMvcConfigurer {

    private final LocalImageStorageService storage;

    public UploadedImagesConfig(LocalImageStorageService storage) {
        this.storage = storage;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/images/uploads/**")
                .addResourceLocations(storage.getResourceLocation())
                .setCacheControl(
                        CacheControl.maxAge(Duration.ofDays(7))
                                .cachePublic()
                );
    }
}