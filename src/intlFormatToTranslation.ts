import { TranslationContent } from './types';

export function intlFormatToTranslation(content: object): {[languageCode: string]: TranslationContent} {
  const result: {[languageCode: string]: TranslationContent} = {};
  
  Object.keys(content).forEach(languageCode => {
    Object.keys(content[languageCode]).forEach(id => {
      const value: string = content[languageCode][id];
      const keys: string[] = id.split('.');
      
      const branchKeys: string[] = keys.slice(0, keys.length - 1);
      const leafKey: string = keys[keys.length - 1];
      
      if (!result[languageCode]) {
        result[languageCode] = {};
      }
      
      let branch: object = result[languageCode];
      
      for (const branchKey of branchKeys) {
        if (!branch[branchKey]) {
          branch[branchKey] = {};
        }
        
        branch = branch[branchKey];
      }
      
      branch[leafKey] = value;
    });
  });
  
  return result;
}