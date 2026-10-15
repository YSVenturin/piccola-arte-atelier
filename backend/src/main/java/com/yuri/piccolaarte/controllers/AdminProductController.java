package com.yuri.piccolaarte.controllers;

import com.yuri.piccolaarte.dtos.AdminProductResponseDTO;
import com.yuri.piccolaarte.dtos.ProductRequestDTO;
import com.yuri.piccolaarte.services.AdminProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    private final AdminProductService adminProductService;

    public AdminProductController(AdminProductService adminProductService) {
        this.adminProductService = adminProductService;
    }

    @GetMapping
    public ResponseEntity<List<AdminProductResponseDTO>> findAll() {
        return ResponseEntity.ok(adminProductService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminProductResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(adminProductService.findById(id));
    }

    @PostMapping
    public ResponseEntity<AdminProductResponseDTO> create(@Valid @RequestBody ProductRequestDTO request) {
        AdminProductResponseDTO product = adminProductService.create(request);

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(product.id())
                .toUri();

        return ResponseEntity.created(location).body(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminProductResponseDTO> update(@PathVariable Long id, @Valid @RequestBody ProductRequestDTO request) {
        AdminProductResponseDTO product = adminProductService.update(
                id,
                request
        );

        return ResponseEntity.ok(product);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        adminProductService.delete(id);

        return ResponseEntity.noContent().build();
    }
}