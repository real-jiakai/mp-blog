import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

const parser = new MarkdownIt({
	html: true,
	breaks: true,
	linkify: true,
});

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
			
			// 将Markdown转换为HTML
			const html = parser.render(post.body);
			
			// 清理和净化HTML
			const sanitizedHtml = sanitizeHtml(html, {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'video', 'audio']),
				allowedAttributes: {
					...sanitizeHtml.defaults.allowedAttributes,
					img: ['src', 'alt', 'title', 'width', 'height'],
					a: ['href', 'title', 'target'],
				},
			});
			
			return {
				title: post.data.title,
				description: post.data.description,
				content: sanitizedHtml, // 使用渲染后的HTML内容
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
