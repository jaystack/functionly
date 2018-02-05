import { CLASS_CLOUDFORMATION } from '../../constants';
import { getMetadata, defineMetadata } from '../../metadata';
import { rest, CorsConfig } from '../rest';

export const defaultConfig = {
	stack: null,
	resourceName: null
};

export const cloudFormation = (config?: { stack?: string; resourceName?: string }) => {
	return (target: Function) => {
		let metadata = getMetadata(CLASS_CLOUDFORMATION, target);
		if (!metadata) {
			metadata = { ...defaultConfig };
		}
		defineMetadata(CLASS_CLOUDFORMATION, { ...metadata, ...config }, target);
	};
};
