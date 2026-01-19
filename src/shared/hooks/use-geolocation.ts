import { useState, useEffect } from "react";

interface GeolocationState {
  lat: number | null;
  lon: number | null;
  error: string | null;
  loading: boolean;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lon: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported",
        loading: false,
      }));
      return;
    }

    // 에러를 완전히 무시하기 위해 try-catch 사용
    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            error: null,
            loading: false,
          });
        },
        (_error) => {
          // 에러를 조용히 처리 (콘솔에 로그하지 않음)
          setState({
            lat: null,
            lon: null,
            error: null, // 에러 메시지를 null로 설정하여 UI에 표시하지 않음
            loading: false,
          });
        },
        {
          enableHighAccuracy: false,
          timeout: 5000, // 타임아웃을 짧게 설정
          maximumAge: 300000, // 5분간 캐시 사용
        }
      );
    } catch (_error) {
      // 예상치 못한 에러도 조용히 처리
      setState({
        lat: null,
        lon: null,
        error: null,
        loading: false,
      });
    }
  }, []);

  return state;
};
