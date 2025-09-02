#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔍 DIAGNÓSTICO DE BOTONES - SISTEMA DE ANÁLISIS DE FUNCIONALIDAD

Este script analiza todos los botones en el sistema y verifica que tengan
las funciones JavaScript correspondientes correctamente conectadas.

Autor: Sistema Administrativo
Fecha: 2024
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass, asdict
from collections import defaultdict


@dataclass
class ButtonInfo:
    """Información de un botón encontrado"""
    id: str
    file_path: str
    line_number: int
    text_content: str = ""
    classes: str = ""
    data_attributes: Dict[str, str] = None
    event_listeners: List[str] = None
    
    def __post_init__(self):
        if self.data_attributes is None:
            self.data_attributes = {}
        if self.event_listeners is None:
            self.event_listeners = []


@dataclass
class FunctionInfo:
    """Información de una función JavaScript"""
    name: str
    file_path: str
    line_number: int
    parameters: List[str] = None
    is_connected: bool = False
    button_ids: List[str] = None
    
    def __post_init__(self):
        if self.parameters is None:
            self.parameters = []
        if self.button_ids is None:
            self.button_ids = []


@dataclass
class DiagnosticReport:
    """Reporte de diagnóstico completo"""
    total_buttons: int
    connected_buttons: int
    disconnected_buttons: int
    total_functions: int
    unused_functions: int
    buttons: Dict[str, ButtonInfo] = None
    functions: Dict[str, FunctionInfo] = None
    issues: List[str] = None
    recommendations: List[str] = None
    
    def __post_init__(self):
        if self.buttons is None:
            self.buttons = {}
        if self.functions is None:
            self.functions = {}
        if self.issues is None:
            self.issues = []
        if self.recommendations is None:
            self.recommendations = []


class ButtonDiagnostics:
    """
    🧪 ANALIZADOR DE BOTONES Y FUNCIONES
    
    Escanea el proyecto buscando:
    - Botones en HTML con IDs
    - Funciones JavaScript que manejan eventos
    - Conexiones entre botones y funciones
    - Problemas de conectividad
    """
    
    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root or os.getcwd())
        self.buttons: Dict[str, ButtonInfo] = {}
        self.functions: Dict[str, FunctionInfo] = {}
        self.connections: Dict[str, List[str]] = defaultdict(list)
        
        # Patrones de búsqueda
        self.button_patterns = [
            r'<button[^>]*id\s*=\s*["\']([^"\']+)["\'][^>]*>(.*?)</button>',
            r'<button[^>]*id\s*=\s*["\']([^"\']+)["\'][^>]*/>',
            r'<input[^>]*type\s*=\s*["\'](?:button|submit)["\'][^>]*id\s*=\s*["\']([^"\']+)["\'][^>]*>',
        ]
        
        self.event_listener_patterns = [
            r'getElementById\(["\']([^"\']+)["\']\)\s*\.\s*addEventListener',
            r'document\.querySelector\(["\']#([^"\']+)["\']\)\s*\.\s*addEventListener',
            r'#([a-zA-Z0-9_-]+).*addEventListener',
            r'getElementById\(["\']([^"\']+)["\']\)\s*\.\s*onclick',
            r'getElementById\(["\']([^"\']+)["\']\)\s*\.\s*click',
        ]
        
        self.function_patterns = [
            r'function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)',
            r'const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\([^)]*\)\s*=>\s*{',
            r'let\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\([^)]*\)\s*=>\s*{',
            r'([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*function\s*\([^)]*\)',
            r'([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\([^)]*\)\s*=>\s*{',
        ]
    
    def scan_project(self) -> DiagnosticReport:
        """
        🔍 ESCANEO COMPLETO DEL PROYECTO
        
        Returns:
            DiagnosticReport: Reporte completo del análisis
        """
        print("🚀 Iniciando diagnóstico de botones...")
        
        # Escanear archivos HTML
        self._scan_html_files()
        
        # Escanear archivos JavaScript
        self._scan_js_files()
        
        # Analizar conexiones
        self._analyze_connections()
        
        # Generar reporte
        report = self._generate_report()
        
        print(f"✅ Diagnóstico completado: {report.total_buttons} botones, {report.total_functions} funciones")
        return report
    
    def _scan_html_files(self):
        """Escanea archivos HTML buscando botones"""
        print("📄 Escaneando archivos HTML...")
        
        html_files = list(self.project_root.rglob("*.html"))
        
        for html_file in html_files:
            try:
                with open(html_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                self._extract_buttons_from_html(content, str(html_file))
                
            except Exception as e:
                print(f"⚠️ Error al leer {html_file}: {e}")
    
    def _extract_buttons_from_html(self, content: str, file_path: str):
        """Extrae información de botones de contenido HTML"""
        lines = content.split('\n')
        
        for pattern in self.button_patterns:
            matches = re.finditer(pattern, content, re.IGNORECASE | re.DOTALL)
            
            for match in matches:
                button_id = match.group(1)
                text_content = match.group(2) if match.lastindex >= 2 else ""
                
                # Encontrar línea
                line_number = content[:match.start()].count('\n') + 1
                
                # Extraer atributos adicionales
                button_tag = match.group(0)
                classes = self._extract_attribute(button_tag, 'class')
                data_attrs = self._extract_data_attributes(button_tag)
                
                self.buttons[button_id] = ButtonInfo(
                    id=button_id,
                    file_path=file_path,
                    line_number=line_number,
                    text_content=text_content.strip(),
                    classes=classes,
                    data_attributes=data_attrs
                )
    
    def _scan_js_files(self):
        """Escanea archivos JavaScript buscando funciones y event listeners"""
        print("📜 Escaneando archivos JavaScript...")
        
        js_files = list(self.project_root.rglob("*.js"))
        
        for js_file in js_files:
            try:
                with open(js_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                self._extract_functions_from_js(content, str(js_file))
                self._extract_event_listeners_from_js(content, str(js_file))
                
            except Exception as e:
                print(f"⚠️ Error al leer {js_file}: {e}")
    
    def _extract_functions_from_js(self, content: str, file_path: str):
        """Extrae funciones de contenido JavaScript"""
        lines = content.split('\n')
        
        for pattern in self.function_patterns:
            matches = re.finditer(pattern, content, re.MULTILINE)
            
            for match in matches:
                func_name = match.group(1)
                line_number = content[:match.start()].count('\n') + 1
                
                # Extraer parámetros (simplificado)
                params = []
                param_match = re.search(r'\(([^)]*)\)', match.group(0))
                if param_match and param_match.group(1).strip():
                    params = [p.strip() for p in param_match.group(1).split(',')]
                
                self.functions[func_name] = FunctionInfo(
                    name=func_name,
                    file_path=file_path,
                    line_number=line_number,
                    parameters=params
                )
    
    def _extract_event_listeners_from_js(self, content: str, file_path: str):
        """Extrae event listeners de contenido JavaScript"""
        for pattern in self.event_listener_patterns:
            matches = re.finditer(pattern, content, re.MULTILINE)
            
            for match in matches:
                button_id = match.group(1)
                
                if button_id in self.buttons:
                    # Buscar la función asociada en las líneas cercanas
                    line_start = content[:match.start()].count('\n') + 1
                    function_name = self._find_associated_function(content, match.start(), line_start)
                    
                    if function_name:
                        self.connections[button_id].append(function_name)
                        self.buttons[button_id].event_listeners.append(function_name)
                        
                        if function_name in self.functions:
                            self.functions[function_name].is_connected = True
                            self.functions[function_name].button_ids.append(button_id)
    
    def _find_associated_function(self, content: str, match_start: int, line_number: int) -> str:
        """Busca la función asociada con un event listener"""
        # Buscar hacia adelante en las siguientes líneas
        lines = content[match_start:].split('\n')[:5]  # Buscar en las siguientes 5 líneas
        
        for line in lines:
            # Buscar patrones de función
            func_match = re.search(r'([a-zA-Z_][a-zA-Z0-9_]*)\s*\(', line)
            if func_match:
                return func_match.group(1)
            
            # Buscar arrow functions
            arrow_match = re.search(r'=>\s*([a-zA-Z_][a-zA-Z0-9_]*)', line)
            if arrow_match:
                return arrow_match.group(1)
        
        return None
    
    def _analyze_connections(self):
        """Analiza las conexiones entre botones y funciones"""
        print("🔗 Analizando conexiones...")
        
        # Marcar botones conectados
        for button_id, listeners in self.connections.items():
            if listeners:
                # Buscar más conexiones basadas en el ID del botón
                self._find_additional_connections(button_id)
    
    def _find_additional_connections(self, button_id: str):
        """Busca conexiones adicionales basadas en el ID del botón"""
        # Buscar funciones que mencionen el ID del botón
        for func_name, func_info in self.functions.items():
            try:
                with open(func_info.file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Buscar referencias al ID del botón en la función
                if button_id in content:
                    patterns = [
                        f'getElementById\\(["\']?{re.escape(button_id)}["\']?\\)',
                        f'querySelector\\(["\']?#{re.escape(button_id)}["\']?\\)',
                        f'#{re.escape(button_id)}\\b',
                    ]
                    
                    for pattern in patterns:
                        if re.search(pattern, content):
                            if func_name not in self.connections[button_id]:
                                self.connections[button_id].append(func_name)
                            if button_id not in func_info.button_ids:
                                func_info.button_ids.append(button_id)
                            func_info.is_connected = True
                            break
            
            except Exception:
                continue
    
    def _extract_attribute(self, html_tag: str, attr_name: str) -> str:
        """Extrae un atributo específico de una etiqueta HTML"""
        pattern = f'{attr_name}\\s*=\\s*["\']([^"\']*)["\']'
        match = re.search(pattern, html_tag, re.IGNORECASE)
        return match.group(1) if match else ""
    
    def _extract_data_attributes(self, html_tag: str) -> Dict[str, str]:
        """Extrae atributos data-* de una etiqueta HTML"""
        data_attrs = {}
        pattern = r'data-([a-zA-Z0-9-]+)\\s*=\\s*["\']([^"\']*)["\']'
        matches = re.finditer(pattern, html_tag, re.IGNORECASE)
        
        for match in matches:
            data_attrs[match.group(1)] = match.group(2)
        
        return data_attrs
    
    def _generate_report(self) -> DiagnosticReport:
        """Genera el reporte de diagnóstico"""
        print("📊 Generando reporte...")
        
        connected_buttons = sum(1 for btn_id in self.buttons if self.connections[btn_id])
        disconnected_buttons = len(self.buttons) - connected_buttons
        unused_functions = sum(1 for func in self.functions.values() if not func.is_connected)
        
        issues = []
        recommendations = []
        
        # Identificar problemas
        for button_id, button_info in self.buttons.items():
            if not self.connections[button_id]:
                issues.append(f"❌ Botón '{button_id}' no tiene función conectada ({button_info.file_path}:{button_info.line_number})")
        
        for func_name, func_info in self.functions.items():
            if not func_info.is_connected:
                issues.append(f"⚠️ Función '{func_name}' no está conectada a ningún botón ({func_info.file_path}:{func_info.line_number})")
        
        # Generar recomendaciones
        if disconnected_buttons > 0:
            recommendations.append(f"🔧 Conectar {disconnected_buttons} botones sin funcionalidad")
        
        if unused_functions > 0:
            recommendations.append(f"🧹 Revisar {unused_functions} funciones no utilizadas")
        
        recommendations.append("📚 Implementar patrones consistentes de naming para botones e IDs")
        recommendations.append("🔍 Usar convenciones como 'btn-action-description' para IDs de botones")
        
        return DiagnosticReport(
            total_buttons=len(self.buttons),
            connected_buttons=connected_buttons,
            disconnected_buttons=disconnected_buttons,
            total_functions=len(self.functions),
            unused_functions=unused_functions,
            buttons=self.buttons,
            functions=self.functions,
            issues=issues,
            recommendations=recommendations
        )
    
    def save_report(self, report: DiagnosticReport, output_file: str = "diagnostico_botones_reporte.json"):
        """Guarda el reporte en formato JSON"""
        output_path = self.project_root / output_file
        
        # Convertir a diccionario serializable
        report_dict = asdict(report)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report_dict, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Reporte guardado en: {output_path}")
        return output_path
    
    def print_summary(self, report: DiagnosticReport):
        """Imprime un resumen del reporte"""
        print("\n" + "="*60)
        print("📋 RESUMEN DEL DIAGNÓSTICO DE BOTONES")
        print("="*60)
        
        print(f"🔘 Total de botones encontrados: {report.total_buttons}")
        print(f"✅ Botones conectados: {report.connected_buttons}")
        print(f"❌ Botones desconectados: {report.disconnected_buttons}")
        print(f"⚙️ Total de funciones: {report.total_functions}")
        print(f"🚫 Funciones no utilizadas: {report.unused_functions}")
        
        if report.issues:
            print(f"\n🚨 PROBLEMAS ENCONTRADOS ({len(report.issues)}):")
            for issue in report.issues[:10]:  # Mostrar solo los primeros 10
                print(f"  {issue}")
            if len(report.issues) > 10:
                print(f"  ... y {len(report.issues) - 10} más")
        
        if report.recommendations:
            print(f"\n💡 RECOMENDACIONES ({len(report.recommendations)}):")
            for rec in report.recommendations:
                print(f"  {rec}")
        
        print("\n" + "="*60)
        
        # Estadísticas por archivo
        files_with_buttons = set(btn.file_path for btn in report.buttons.values())
        files_with_functions = set(func.file_path for func in report.functions.values())
        
        print(f"📁 Archivos con botones: {len(files_with_buttons)}")
        print(f"📜 Archivos con funciones: {len(files_with_functions)}")
        
        # Top botones problemáticos
        problematic_buttons = [btn_id for btn_id, btn in report.buttons.items() 
                              if not any(btn_id in connections for connections in [report.buttons[btn_id].event_listeners])]
        
        if problematic_buttons:
            print(f"\n🎯 BOTONES PRIORITARIOS PARA REVISIÓN ({len(problematic_buttons[:5])}):")
            for btn_id in problematic_buttons[:5]:
                btn = report.buttons[btn_id]
                print(f"  • {btn_id}: '{btn.text_content}' en {Path(btn.file_path).name}:{btn.line_number}")


def main():
    """🚀 FUNCIÓN PRINCIPAL"""
    print("🔍 SISTEMA DE DIAGNÓSTICO DE BOTONES")
    print("=" * 50)
    
    # Detectar directorio del proyecto
    current_dir = Path.cwd()
    
    # Buscar el directorio raíz del proyecto
    project_indicators = ['app.py', 'requirements.txt', 'package.json', '.git']
    project_root = current_dir
    
    for indicator in project_indicators:
        if (current_dir / indicator).exists():
            project_root = current_dir
            break
        elif (current_dir.parent / indicator).exists():
            project_root = current_dir.parent
            break
    
    print(f"📂 Directorio del proyecto: {project_root}")
    
    # Crear analizador
    diagnostics = ButtonDiagnostics(str(project_root))
    
    # Ejecutar análisis
    report = diagnostics.scan_project()
    
    # Mostrar resultados
    diagnostics.print_summary(report)
    
    # Guardar reporte
    report_path = diagnostics.save_report(report)
    
    print(f"\n✅ Análisis completado. Revisa el archivo: {report_path}")
    
    return report


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n🛑 Análisis interrumpido por el usuario")
    except Exception as e:
        print(f"\n❌ Error durante el análisis: {e}")
        import traceback
        traceback.print_exc()