import { useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useNavigation, usePreventRemove } from '@react-navigation/native';

/** Protege volver, el gesto de iOS y el acceso a Inicio si hay cambios sin guardar. */
export function useFormGuard(values: unknown[], saving: boolean) {
  const navigation = useNavigation();
  const current = JSON.stringify(values);
  const initial = useRef(current);
  const [saved, setSaved] = useState(initial.current);

  usePreventRemove(saving || current !== saved, ({ data }) => {
    if (saving) return;
    const discard = () => navigation.dispatch(data.action);
    if (Platform.OS === 'web') {
      if (window.confirm('¿Desea cancelar sin guardar los cambios?')) discard();
      return;
    }
    Alert.alert('Descartar cambios', '¿Desea cancelar sin guardar los cambios?', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: discard },
    ]);
  });

  return { markSaved: () => setSaved(current) };
}
