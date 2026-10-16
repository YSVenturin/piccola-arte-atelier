import axios from "axios";

import { api } from "./api";
import type {
  AdminProductResponseDTO,
  ProductRequestDTO,
} from "../types/adminProduct";
import { generateAvailableSlug } from "../utils/slugs";

const endpoint = "/admin/products";

export async function getAdminProducts(signal?: AbortSignal) {
  const { data } = await api.get<AdminProductResponseDTO[]>(
    endpoint,
    { signal },
  );

  return data;
}

export async function createProduct(
  payload: ProductRequestDTO,
) {
  const products = await getAdminProducts();

  const usedSlugs = new Set(
    products.map((product) => product.slug),
  );

  let lastError: unknown;

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateAvailableSlug(
      payload.name,
      usedSlugs,
      "produto",
      140,
    );

    try {
      const { data } = await api.post<AdminProductResponseDTO>(
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
          "A product with this slug already exists."
      ) {
        throw error;
      }

      usedSlugs.add(slug);
      lastError = error;
    }
  }

  throw lastError;
}

export async function updateProduct(
  id: number,
  payload: ProductRequestDTO,
) {
  const { data } = await api.put<AdminProductResponseDTO>(
    `${endpoint}/${id}`,
    payload,
  );

  return data;
}

export async function deleteProduct(id: number) {
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
  name: "Nome: obrigatório, com até 120 caracteres.",
  slug: "Não foi possível definir o endereço do produto. Tente salvar novamente.",
  shortDescription: "Resumo: use até 200 caracteres.",
  description: "Descrição: use até 10.000 caracteres.",
  price:
    "Preço: informe um valor de zero a 99.999.999,99, com até duas casas decimais.",
  material: "Material: use até 80 caracteres.",
  dimensions: "Dimensões: use até 120 caracteres.",
  categoryIds: "Revise as categorias selecionadas.",
};

export function getProductErrorMessage(error: unknown): string {
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
    return "O produto não foi encontrado. Atualize a página.";
  }

  if (status === 409) {
    return data.detail ===
      "A product with this slug already exists."
      ? "Não foi possível reservar o endereço do produto. Atualize a página e tente novamente."
      : "A operação conflita com os dados atuais. Atualize a página e revise o produto.";
  }

  if (status === 400) {
    const messages = (data.errors ?? []).map(
      ({ field }) =>
        fieldMessages[field.split("[")[0]] ??
        "Revise as opções informadas.",
    );

    return (
      [...new Set(messages)].join(" ") ||
      "Revise os campos, o preço visível e as categorias selecionadas."
    );
  }

  return "O servidor não conseguiu concluir a operação. Tente novamente mais tarde.";
}