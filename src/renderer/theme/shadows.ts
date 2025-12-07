import { alpha } from '@mui/material';
import { Theme, Shadows } from '@mui/material/styles';

export const shadows = (theme: Theme): Shadows => {
  const { grey, mode } = theme.palette;
  const shadowColorMain = mode === 'light' ? grey[500] : '#000000';
  const shadowColor1 = alpha(shadowColorMain, 0.03);
  const shadowColor2 = alpha(shadowColorMain, 0.04);
  const shadowColor3 = alpha(shadowColorMain, 0.08);

  return [
    `none`,
    `0px 2px 1px -1px ${shadowColor1},0px 1px 1px 0px ${shadowColor2},0px 1px 3px 0px ${shadowColor3}`,
    `0px 3px 3px -2px ${shadowColor1},0px 2px 6px 0px ${shadowColor2},0px 1px 12px 0px ${shadowColor3}`,
    `0px 3px 4px -2px ${shadowColor1},0px 3px 8px 0px ${shadowColor2},0px 1px 19px 0px ${shadowColor3}`,
    `0px 2px 5px -1px ${shadowColor1},0px 4px 10px 0px ${shadowColor2},0px 1px 22px 0px ${shadowColor3}`,
    `0px 3px 6px -1px ${shadowColor1},0px 5px 12px 0px ${shadowColor2},0px 1px 25px 0px ${shadowColor3}`,
    `0px 3px 8px -1px ${shadowColor1},0px 6px 14px 0px ${shadowColor2},0px 1px 28px 0px ${shadowColor3}`,
    `0px 4px 8px -2px ${shadowColor1},0px 7px 16px 1px ${shadowColor2},0px 2px 31px 1px ${shadowColor3}`,
    `0px 5px 10px -3px ${shadowColor1},0px 8px 18px 1px ${shadowColor2},0px 3px 33px 2px ${shadowColor3}`,
    `0px 5px 12px -3px ${shadowColor1},0px 9px 24px 1px ${shadowColor2},0px 3px 16px 2px ${shadowColor3}`,
    `0px 6px 12px -3px ${shadowColor1},0px 10px 28px 1px ${shadowColor2},0px 4px 18px 3px ${shadowColor3}`,
    `0px 6px 14px -4px ${shadowColor1},0px 11px 15px 1px ${shadowColor2},0px 4px 20px 3px ${shadowColor3}`,
    `0px 7px 16px -4px ${shadowColor1},0px 12px 17px 2px ${shadowColor2},0px 5px 22px 4px ${shadowColor3}`,
    `0px 7px 16px -4px ${shadowColor1},0px 13px 19px 2px ${shadowColor2},0px 5px 24px 4px ${shadowColor3}`,
    `0px 7px 18px -4px ${shadowColor1},0px 14px 21px 2px ${shadowColor2},0px 5px 26px 4px ${shadowColor3}`,
    `0px 8px 18px -5px ${shadowColor1},0px 15px 22px 2px ${shadowColor2},0px 6px 28px 5px ${shadowColor3}`,
    `0px 8px 20px -5px ${shadowColor1},0px 16px 24px 2px ${shadowColor2},0px 6px 30px 5px ${shadowColor3}`,
    `0px 8px 22px -5px ${shadowColor1},0px 17px 26px 2px ${shadowColor2},0px 6px 32px 5px ${shadowColor3}`,
    `0px 9px 22px -5px ${shadowColor1},0px 18px 28px 2px ${shadowColor2},0px 7px 34px 6px ${shadowColor3}`,
    `0px 9px 24px -6px ${shadowColor1},0px 19px 29px 2px ${shadowColor2},0px 7px 36px 6px ${shadowColor3}`,
    `0px 10px 26px -6px ${shadowColor1},0px 20px 31px 3px ${shadowColor2},0px 8px 38px 7px ${shadowColor3}`,
    `0px 10px 26px -6px ${shadowColor1},0px 21px 33px 3px ${shadowColor2},0px 8px 40px 7px ${shadowColor3}`,
    `0px 10px 28px -6px ${shadowColor1},0px 22px 35px 3px ${shadowColor2},0px 8px 42px 7px ${shadowColor3}`,
    `0px 11px 28px -7px ${shadowColor1},0px 23px 36px 3px ${shadowColor2},0px 9px 44px 8px ${shadowColor3}`,
    `0px 11px 30px -7px ${shadowColor1},0px 24px 38px 3px ${shadowColor2},0px 9px 46px 8px ${shadowColor3}`,
  ] as Shadows;
};
