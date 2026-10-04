import { supabase } from '../../lib/supabase';
import { Producto, ProductoInsert, ProductoUpdate } from '../../types/database.types';
import { IProductoRepository } from '../interfaces/IProductoRepository';
import { centavosToPesos } from '../../utils/money';

function mapProducto(row: any): Producto {
  return {
    ...row,
    precio_costo_centavos: Number(row.precio_costo_centavos ?? 0),
    precio_venta_centavos: Number(row.precio_venta_centavos ?? 0),
    precio_costo: centavosToPesos(Number(row.precio_costo_centavos ?? 0)),
    precio_venta: centavosToPesos(Number(row.precio_venta_centavos ?? 0)),
    activo: Boolean(row.activo ?? true),
  };
}

export class SupabaseProductoRepository implements IProductoRepository {
  async getAll(includeArchived = false): Promise<Producto[]> {
    let query = supabase.from('productos').select('*');
    if (!includeArchived) {
      query = query.eq('activo', true);
    }
    const { data, error } = await query.order('nombre', { ascending: true });

    if (error) throw new Error(`Error al obtener productos: ${error.message}`);
    return (data || []).map(mapProducto);
  }

  async getById(id: string): Promise<Producto | null> {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Error al obtener producto ${id}: ${error.message}`);
    return data ? mapProducto(data) : null;
  }

  async search(query: string, includeArchived = false): Promise<Producto[]> {
    const q = query.trim();
    if (!q) return this.getAll(includeArchived);

    let dbQuery = supabase
      .from('productos')
      .select('*')
      .ilike('nombre', `%${q}%`);

    if (!includeArchived) {
      dbQuery = dbQuery.eq('activo', true);
    }

    const { data, error } = await dbQuery.order('nombre', { ascending: true });
    if (error) throw new Error(`Error buscando productos: ${error.message}`);
    return (data || []).map(mapProducto);
  }

  async create(data: ProductoInsert): Promise<Producto> {
    const { data: created, error } = await supabase
      .from('productos')
      .insert({
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null,
        unidad: data.unidad,
        precio_costo_centavos: data.precio_costo_centavos ?? 0,
        precio_venta_centavos: data.precio_venta_centavos ?? 0,
        activo: data.activo ?? true,
      })
      .select('*')
      .single();

    if (error) throw new Error(`Error al crear producto: ${error.message}`);
    return mapProducto(created);
  }

  async update(id: string, data: ProductoUpdate): Promise<Producto> {
    const updatePayload: any = { ...data };
    if (updatePayload.nombre) updatePayload.nombre = updatePayload.nombre.trim();
    if (updatePayload.descripcion !== undefined) {
      updatePayload.descripcion = updatePayload.descripcion?.trim() || null;
    }

    const { data: updated, error } = await supabase
      .from('productos')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Error al actualizar producto ${id}: ${error.message}`);
    return mapProducto(updated);
  }

  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from('productos')
      .update({ activo: false })
      .eq('id', id);

    if (error) throw new Error(`Error al archivar producto ${id}: ${error.message}`);
  }

  async restore(id: string): Promise<void> {
    const { error } = await supabase
      .from('productos')
      .update({ activo: true })
      .eq('id', id);

    if (error) throw new Error(`Error al restaurar producto ${id}: ${error.message}`);
  }

  async updatePreciosSugeridos(
    id: string,
    precioCostoCentavos: number,
    precioVentaCentavos: number
  ): Promise<void> {
    const { error } = await supabase
      .from('productos')
      .update({
        precio_costo_centavos: precioCostoCentavos,
        precio_venta_centavos: precioVentaCentavos,
      })
      .eq('id', id);

    if (error) throw new Error(`Error actualizando precios de producto ${id}: ${error.message}`);
  }
}
