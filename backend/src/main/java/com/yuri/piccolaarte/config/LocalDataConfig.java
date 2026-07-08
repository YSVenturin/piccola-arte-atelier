package com.yuri.piccolaarte.config;

import com.yuri.piccolaarte.entities.Category;
import com.yuri.piccolaarte.entities.Product;
import com.yuri.piccolaarte.repositories.CategoryRepository;
import com.yuri.piccolaarte.repositories.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.List;
import java.math.BigDecimal;

@Configuration
@Profile("local")
public class LocalDataConfig implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    private final ProductRepository productRepository;

    public LocalDataConfig(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        if (categoryRepository.count() == 0 && productRepository.count() == 0) {
            Category incenseHolders = new Category(
                    null,
                    "Incensários",
                    "incensarios",
                    "Peças artesanais para perfumar e decorar ambientes.",
                    true,
                    1
            );

            Category decorativeApples = new Category(
                    null,
                    "Maçãs Decorativas",
                    "macas-decorativas",
                    "Pequenas peças coloridas para decorar com charme e alegria.",
                    true,
                    2
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
                    decorativeApples,
                    bowsAndKeychains,
                    jewelryTrays,
                    decorativePieces
            ));

            Product p1 = new Product(
                    null,
                    "Incensário Casinha Azul",
                    "incensario-casinha-azul",
                    "Um cantinho de tranquilidade feito à mão.",
                    "Incensário artesanal em cerâmica fria, com pequena casinha decorativa e acabamento delicado.",
                    new BigDecimal("49.90"),
                    false,
                    true,
                    "Cerâmica fria",
                    "Aproximadamente 12cm x 8cm",
                    true,
                    true,
                    true
            );

            Product p2 = new Product(
                    null,
                    "Maçãs Encantadas",
                    "macas-encantadas",
                    "Pequenas maçãs coloridas cheias de personalidade.",
                    "Conjunto de peças decorativas em formato de maçãs, feitas manualmente em cerâmica fria.",
                    new BigDecimal("39.90"),
                    false,
                    true,
                    "Cerâmica fria",
                    "Aproximadamente 4cm cada peça",
                    true,
                    true,
                    true
            );

            Product p3 = new Product(
                    null,
                    "Chaveiro Farfalle Amarelo",
                    "chaveiro-farfalle-amarelo",
                    "Charme artesanal para levar no dia a dia.",
                    "Chaveiro artesanal inspirado no formato farfalle, feito em cerâmica fria com acabamento amarelo.",
                    new BigDecimal("24.90"),
                    false,
                    true,
                    "Cerâmica fria e argola metálica",
                    "Aproximadamente 5cm",
                    true,
                    true,
                    false
            );

            Product p4 = new Product(
                    null,
                    "Laços Amarelos Decorativos",
                    "lacos-amarelos-decorativos",
                    "Pequenos laços para decorar com delicadeza.",
                    "Peças artesanais em formato de laço, feitas em cerâmica fria.",
                    new BigDecimal("19.90"),
                    false,
                    false,
                    "Cerâmica fria",
                    "Aproximadamente 3cm cada peça",
                    true,
                    true,
                    true
            );

            Product p5 = new Product(
                    null,
                    "Porta-Joias Orgânico",
                    "porta-joias-organico",
                    "Organização com leveza e estilo artesanal.",
                    "Porta-joias artesanal em cerâmica fria, ideal para acomodar anéis, brincos e pequenos acessórios.",
                    new BigDecimal("44.90"),
                    false,
                    true,
                    "Cerâmica fria",
                    "Aproximadamente 10cm x 8cm",
                    true,
                    true,
                    true
            );

            Product p6 = new Product(
                    null,
                    "Mini Peça Decorativa Afeto",
                    "mini-peca-decorativa-afeto",
                    "Pequenos detalhes que transformam o simples em especial.",
                    "Peça decorativa artesanal feita em cerâmica fria, pensada para compor ambientes ou presentear.",
                    new BigDecimal("29.90"),
                    false,
                    false,
                    "Cerâmica fria",
                    "Aproximadamente 6cm",
                    true,
                    true,
                    true
            );

            productRepository.saveAll(List.of(p1, p2, p3, p4, p5, p6));

            p1.getCategories().add(incenseHolders);
            p1.getCategories().add(decorativePieces);

            p2.getCategories().add(decorativeApples);
            p2.getCategories().add(decorativePieces);

            p3.getCategories().add(bowsAndKeychains);

            p4.getCategories().add(bowsAndKeychains);
            p4.getCategories().add(decorativePieces);

            p5.getCategories().add(jewelryTrays);
            p5.getCategories().add(decorativePieces);

            p6.getCategories().add(decorativePieces);

            productRepository.saveAll(List.of(p1, p2, p3, p4, p5, p6));
        }
    }
}
