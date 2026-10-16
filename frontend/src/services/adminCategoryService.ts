import axios from "axios";

import { api } from "./api";
import type {
  CategoryRequestDTO,
  CategoryResponseDTO,
} from "../types/category";
import { generateAvailableSlug } from "../utils/slugs";

const endpoint = "/admin/categories";

export async function getAdminCategories(signal?: AbortSignal) {
  const { data } = await api.get<CategoryResponseDTO[]>(
    endpoint,
    { signal },
  );

  return data;
}

export async function createCategory(
  payload: CategoryRequestDTO,
) {
  const categories = await getAdminCategories();

  const usedSlugs = new Set(
    categories.map((category) => category.slug),
  );

  let lastError: unknown;

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateAvailableSlug(
      payload.name,
      usedSlugs,
      "categoria",
      100,
    );

    try {
      const { data } = await api.post<CategoryResponseDTO>(
        endpoint,
        {
          ...payload,
          slug,
        },
      );

      return data;
    } catch (error) {
      if (
        !axios.isAxiosError<ApiProblem>(error) ||
        error.response?.status !== 409 ||
        error.response.data.detail !==
          "A category with this slug already exists."
      ) {
        throw error;
      }

      usedSlugs.add(slug);
      lastError = error;
    }
  }

  throw lastError;
}

export async function updateCategory(
  id: number,
  payload: CategoryRequestDTO,
) {
  const { data } = await api.put<CategoryResponseDTO>(
    `${endpoint}/${id}`,
    payload,
  );

  return data;
}

export async function deleteCategory(id: number) {
  await api.delete(`${endpoint}/${id}`);
}

interface ApiProblem {
  detail?: string;
  errors?: {
    field: string;
    message: string;
  }[];
}

const fieldMessages: Record<string, string> = {
  name: "Nome: preencha até 80 caracteres.",
  slug: "Não foi possível definir o endereço da categoria. Tente salvar novamente.",
  description: "Descrição: use até 2.000 caracteres.",
  active: "Informe se a categoria está ativa.",
  displayOrder:
    "Ordem: informe um número inteiro maior ou igual a zero.",
};

export function getCategoryErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiProblem>(error)) {
    return "Não foi possível concluir a operação.";
  }

  if (!error.response) {
    return "Não foi possível confirmar a operação com o servidor. Verifique a conexão e atualize a página antes de repetir uma alteração.";
  }

  const { status, data } = error.response;

  if (status === 401) {
    return "Sua sessão terminou. Entre novamente.";
  }

  if (status === 403) {
    return "A operação foi recusada. Atualize a página e confira seu acesso.";
  }

  if (status === 404) {
    return "Esta categoria não foi encontrada. Atualize a página.";
  }

  if (status === 409) {
    if (
      data.detail ===
      "A category with this slug already exists."
    ) {
      return "Não foi possível reservar o endereço da categoria. Atualize a página e tente novamente.";
    }

    if (
      data.detail ===
      "Category cannot be deleted because it has associated products. Deactivate it instead."
    ) {
      return "Esta categoria possui produtos vinculados e não pode ser excluída. Você pode editá-la e desativá-la.";
    }

    return "A operação conflita com os dados atuais. Atualize a página e revise a categoria.";
  }

  if (status === 400) {
    const messages = (data.errors ?? []).map(
      ({ field }) =>
        fieldMessages[field] ?? "Revise os campos informados.",
    );

    return (
      [...new Set(messages)].join(" ") ||
      "Revise os campos informados."
    );
  }

  return "O servidor não conseguiu concluir a operação. Tente novamente mais tarde.";
}