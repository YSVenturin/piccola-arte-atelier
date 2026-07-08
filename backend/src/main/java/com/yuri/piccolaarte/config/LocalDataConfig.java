package com.yuri.piccolaarte.config;

import com.yuri.piccolaarte.entities.Category;
import com.yuri.piccolaarte.repositories.CategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.List;

@Configuration
@Profile("local")
public class LocalDataConfig implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    public LocalDataConfig(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public void run(String... args) {
        if (categoryRepository.count() > 0) {
            return;
        }

        Category incenseHolders = new Category(
                null,
                "Incensários",
                "incensarios",
                "Peças artesanais para perfumar e decorar ambientes.",
                true,
                1
        );

        Category bowsAndKeychains = new Category(
                null,
                "Laços e Chaveiros",
                "lacos-e-chaveiros",
                "Peças delicadas para uso no dia a dia ou para presentear.",
                true,
                3
        );

        Category jewelryTrays = new Category(
                null,
                "Porta-Joias",
                "porta-joias",
                "Peças artesanais para organizar acessórios com charme.",
                true,
                4
        );

        Category decorativePieces = new Category(
                null,
                "Peças Decorativas",
                "pecas-decorativas",
                "Objetos artesanais que trazem personalidade para o ambiente.",
                true,
                5
        );

        categoryRepository.saveAll(List.of(
                incenseHolders,
                bowsAndKeychains,
                jewelryTrays,
                decorativePieces
        ));
    }
}
