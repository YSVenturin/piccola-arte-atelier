package com.yuri.piccolaarte.storage;

import org.springframework.web.multipart.MultipartFile;

public interface ImageStorageService {
    String store(MultipartFile file);

    void delete(String url);

    void deleteAfterCommit(String url);
}
