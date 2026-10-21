package com.yuri.piccolaarte.dtos;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record ProductImageOrderDTO(
        @NotEmpty
        List<@NotNull @Positive Long> imageIds
) {
}