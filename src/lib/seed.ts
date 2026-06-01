import type { MenuItem } from "./types";
import prato from "@/assets/prato-executivo.jpg";
import parm from "@/assets/parmegiana.jpg";
import frangoAssado from "@/assets/frango-assado.jpg";
import batata from "@/assets/batata-frita.jpg";
import caipirinha from "@/assets/caipirinha.jpg";
import cerveja from "@/assets/cerveja.jpg";
import salada from "@/assets/salada.jpg";
import file from "@/assets/file.jpg";
import polenta from "@/assets/polenta.jpg";
import frangoFrito from "@/assets/frango-frito.jpg";
import suco from "@/assets/suco.jpg";
import refri from "@/assets/refrigerante.jpg";

const m = (
  id: string,
  name: string,
  price: number,
  category: MenuItem["category"],
  image?: string,
  description?: string,
): MenuItem => ({ id, name, price, category, image, description, available: true });

export const seedMenu: MenuItem[] = [
  // Executivos
  m("exec-misto", "Prato Executivo Misto", 32, "executivos", prato, "Arroz, feijão, bife, fritas e salada"),
  m("exec-frango", "Prato Executivo Frango", 30, "executivos", prato, "Arroz, feijão, frango grelhado e salada"),
  m("parm-file", "Filé à Parmegiana", 48, "executivos", parm, "Filé empanado com molho e queijo"),
  m("parm-frango", "Parmegiana de Frango", 42, "executivos", parm, "Frango empanado com molho e queijo"),

  // Carnes
  m("file-mignon", "Filé Mignon Grelhado", 58, "carnes", file, "Filé suculento com chimichurri"),
  m("file-acebolado", "Filé Acebolado", 52, "carnes", file, "Filé com cebolas caramelizadas"),

  // Frango
  m("frango-assado", "Frango Assado (1/2)", 36, "frango", frangoAssado, "Meio frango assado temperado"),
  m("frango-frito", "Frango Frito", 34, "frango", frangoFrito, "Crocante, servido com limão"),
  m("file-frango", "Filé de Frango Grelhado", 32, "frango", frangoAssado, "Filé temperado na chapa"),

  // Acompanhamentos
  m("arroz", "Arroz Branco", 8, "acompanhamentos"),
  m("feijao", "Feijão", 8, "acompanhamentos"),
  m("batata", "Batata Frita", 22, "acompanhamentos", batata, "Crocante por fora, macia por dentro"),
  m("polenta", "Polenta Frita", 22, "acompanhamentos", polenta, "Dourada e crocante"),

  // Saladas
  m("salada-mista", "Salada Mista", 18, "saladas", salada, "Alface, tomate, cebola e pepino"),
  m("salada-verde", "Salada Verde", 16, "saladas", salada, "Folhas variadas"),

  // Bebidas
  m("agua", "Água Mineral", 5, "bebidas"),
  m("agua-gas", "Água com Gás", 6, "bebidas"),
  m("refri-lata", "Refrigerante Lata", 7, "bebidas", refri),
  m("refri-2l", "Refrigerante 2L", 15, "bebidas", refri),
  m("suco-laranja", "Suco de Laranja Natural", 10, "bebidas", suco),
  m("suco-maracuja", "Suco de Maracujá", 10, "bebidas", suco),

  // Cervejas
  m("cerveja-long", "Cerveja Long Neck", 10, "cervejas", cerveja),
  m("cerveja-600", "Cerveja 600ml", 14, "cervejas", cerveja),
  m("chopp", "Chopp 300ml", 12, "cervejas", cerveja),

  // Drinks
  m("caipirinha", "Caipirinha de Limão", 18, "drinks", caipirinha, "Cachaça, limão e açúcar"),
  m("caipi-vodka", "Caipiroska de Frutas", 22, "drinks", caipirinha, "Vodka com fruta da estação"),
];

export const categoryLabels: Record<MenuItem["category"], string> = {
  executivos: "Pratos Executivos",
  carnes: "Carnes",
  frango: "Frango",
  acompanhamentos: "Acompanhamentos",
  saladas: "Saladas",
  bebidas: "Bebidas",
  cervejas: "Cervejas",
  drinks: "Drinks Especiais",
};