import { useState, useEffect, useCallback } from 'react';

export const useFullScreen = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, []);

  const enterFullScreen = useCallback(async () => {
    try {
      // Check if already in fullscreen
      if (document.fullscreenElement) {
        console.log('Already in fullscreen mode');
        return;
      }

      const element = document.documentElement;

      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    } catch (error) {
      // Don't log permission errors as they're expected on first load
      if (!(error instanceof Error) || !error.message.includes('Permissions check failed')) {
        console.error('Failed to enter fullscreen:', error);
      }
    }
  }, []);

  const exitFullScreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, []);

  const toggleFullScreen = useCallback(async () => {
    if (isFullScreen) {
      await exitFullScreen();
    } else {
      await enterFullScreen();
    }
  }, [isFullScreen, enterFullScreen, exitFullScreen]);

  return {
    isFullScreen,
    enterFullScreen,
    exitFullScreen,
    toggleFullScreen
  };
};
