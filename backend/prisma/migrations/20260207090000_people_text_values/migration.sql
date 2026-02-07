UPDATE Person
SET sex = CASE sex
  WHEN 'M' THEN 'Masculino'
  WHEN 'F' THEN 'Feminino'
  WHEN 'I' THEN 'Intersexo'
  WHEN 'N' THEN 'Nao informado'
  ELSE sex
END;

UPDATE Person
SET gender = CASE gender
  WHEN 'H' THEN 'Homem'
  WHEN 'M' THEN 'Mulher'
  WHEN 'NB' THEN 'Nao binario'
  WHEN 'GF' THEN 'Genero fluido'
  WHEN 'AG' THEN 'Agenero'
  WHEN 'O' THEN 'Outro'
  WHEN 'PNI' THEN 'Prefiro nao informar'
  ELSE gender
END;

UPDATE Person
SET raceColor = CASE raceColor
  WHEN 'BR' THEN 'Branca'
  WHEN 'PR' THEN 'Preta'
  WHEN 'PA' THEN 'Parda'
  WHEN 'AM' THEN 'Amarela'
  WHEN 'IN' THEN 'Indigena'
  WHEN 'PNI' THEN 'Prefiro nao informar'
  ELSE raceColor
END;
