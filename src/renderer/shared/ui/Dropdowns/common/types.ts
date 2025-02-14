import { ReactNode, MouseEvent } from 'react';

import { IconNames } from '@shared/ui/Icon/data';

export type Position = 'up' | 'down' | 'auto';
export type Theme = 'dark' | 'light';

export type DropdownOption<T extends any = any> = {
  id: string;
  element: ReactNode;
  value: T;
  disabled?: boolean;
};

export type DropdownResult<T extends any = any> = {
  id: string;
  value: T;
};

export type ComboboxOption<T extends any = any> = DropdownOption<T>;

export type DropdownIconButtonOption = {
  icon: IconNames;
  title: string;
  onClick: () => void;
};

type OptionBase = {
  id: string;
  title: string;
  icon: IconNames | ReactNode;
};

type LinkOption = OptionBase & { to: string };
type ButtonOption = OptionBase & { onClick?: (event: MouseEvent<HTMLButtonElement>) => void };

export type ButtonDropdownOption = LinkOption | ButtonOption;
