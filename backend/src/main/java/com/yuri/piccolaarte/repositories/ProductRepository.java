package com.yuri.piccolaarte.repositories;

import com.yuri.piccolaarte.entities.Product;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByActiveTrueOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {
            "categories",
            "productImages"
    })
    @Query("""
            SELECT DISTINCT product
            FROM Product product
            JOIN product.categories category
            WHERE product.active = true
              AND category.active = true
              AND category.slug = :categorySlug
            ORDER BY product.createdAt DESC
            """)
    List<Product> findActiveByCategorySlug(
            @Param("categorySlug") String categorySlug
    );

    Optional<Product> findBySlug(String slug);
}
