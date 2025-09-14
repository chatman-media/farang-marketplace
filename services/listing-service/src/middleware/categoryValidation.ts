import { ListingCategory } from "@marketplace/shared-types"
import { FastifyReply, FastifyRequest } from "fastify"

import { getCategoryConfig, isCategoryEnabled } from "../config/categories"

export interface CategoryValidationRequest extends FastifyRequest {
  body: {
    category?: ListingCategory
  }
  params: {
    category?: string
  }
  query: {
    category?: string | string[]
  }
}

export const validateCategoryEnabled = async (
  request: CategoryValidationRequest,
  reply: FastifyReply,
): Promise<void> => {
  // Check category from body, params, or query
  const category =
    request.body?.category ||
    request.params?.category ||
    (Array.isArray(request.query?.category) ? request.query.category[0] : request.query?.category)

  if (!category) {
    // No category specified, continue
    return
  }

  // Validate if category exists in enum
  if (!Object.values(ListingCategory).includes(category as ListingCategory)) {
    return reply.code(400).send({
      success: false,
      message: `Invalid category: ${category}`,
      availableCategories: Object.values(ListingCategory),
    })
  }

  const categoryEnum = category as ListingCategory

  // Check if category is enabled
  if (!isCategoryEnabled(categoryEnum)) {
    const config = getCategoryConfig(categoryEnum)
    const message = config?.comingSoon
      ? `Category "${config.label}" is coming soon!`
      : `Category "${category}" is currently disabled`

    return reply.code(403).send({
      success: false,
      message,
      category: categoryEnum,
      comingSoon: config?.comingSoon ?? false,
    })
  }
}

export const filterEnabledCategories = (categories: string[]): ListingCategory[] => {
  return categories
    .filter((cat): cat is ListingCategory => Object.values(ListingCategory).includes(cat as ListingCategory))
    .filter(isCategoryEnabled)
}
