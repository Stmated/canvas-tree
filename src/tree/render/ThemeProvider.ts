import {Theme} from "./Theme";

export interface ThemeProvider {

    getTheme(): Theme;
}