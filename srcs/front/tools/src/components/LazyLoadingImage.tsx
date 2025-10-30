interface LazyLoadingImageProps {
  children: React.ReactNode;
  dimension: { width: string; height: string };
  loading: boolean;
}

export function LazyLoadingImage({
  children,
  dimension,
  loading,
}: LazyLoadingImageProps): JSX.Element {
  return (
    <div className={`relative`}>
      {children}
      {!loading && (
        <div
          className={`absolute inset-0 ${dimension.width} ${dimension.height} rounded-full backdrop-blur-md bg-primary-bg/30 animate-pulse`}
        />
      )}
    </div>
  );
}
