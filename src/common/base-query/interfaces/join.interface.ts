export interface JoinColumn {
  propertyName: string;
}

export interface RelationMetadata {
  propertyName: string;
  inverseEntityMetadata: EntityMetadataInfo;
  joinColumns?: JoinColumn[];
  inverseJoinColumns?: JoinColumn[];
}

export interface ColumnMetadata {
  propertyName: string;
  isVirtual: boolean;
}

export interface EntityMetadataInfo {
  relations: RelationMetadata[];
  columns: ColumnMetadata[];
}
