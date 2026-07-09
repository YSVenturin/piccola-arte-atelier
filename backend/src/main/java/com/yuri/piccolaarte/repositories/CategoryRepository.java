package com.yuri.piccolaarte.repositories;

import com.yuri.piccolaarte.entities.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByActiveTrueOrderByDisplayOrderAsc();

    Optional<Category> findBySlug(String slug);
}
