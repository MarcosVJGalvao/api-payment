import { Injectable } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';

@Injectable()
export class SwaggerDocumentCacheService {
  private baseDocument?: OpenAPIObject;
  private readonly filteredDocuments = new Map<string, OpenAPIObject>();

  setBaseDocument(document: OpenAPIObject): void {
    this.baseDocument = document;
    this.filteredDocuments.clear();
  }

  getBaseDocument(): OpenAPIObject | undefined {
    return this.baseDocument;
  }

  getFilteredDocument(authKey: string): OpenAPIObject | undefined {
    return this.filteredDocuments.get(authKey);
  }

  setFilteredDocument(authKey: string, document: OpenAPIObject): void {
    this.filteredDocuments.set(authKey, document);
  }
}

