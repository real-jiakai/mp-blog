import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
	const posts = await getCollection('blog', ({ data }) => {
		// 过滤掉草稿文章
		return data.draft !== true;
	});
	
	// 渲染每篇文章的完整内容
	const rssItems = await Promise.all(
		posts.map(async (post) => {
			const date = new Date(post.data.pubDate);
			const year = date.getFullYear();
			const month = (date.getMonth() + 1).toString().padStart(2, '0');
			const slug = post.data.slug || post.id;
			
			// 渲染文章内容
			const { render } = await import('astro:content');
			const { Content } = await render(post);
			
			// 创建一个临时的渲染环境来获取HTML
			const html = await new Promise((resolve) => {
				import('astro/runtime/server/index.js').then(({ renderComponent }) => {
					// 简化处理：直接使用markdown内容
					resolve(post.body || '');
				}).catch(() => {
					// 如果渲染失败，使用原始markdown内容
					resolve(post.body || '');
				});
			});
			
			return {
				title: post.data.title,
				description: post.data.description,
				content: post.body, // 使用markdown原文作为全文内容
				pubDate: post.data.pubDate,
				link: `/${year}/${month}/${slug}/`,
			};
		})
	);
	
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: rssItems,
		customData: `<language>zh-CN</language>`,
	});
}
