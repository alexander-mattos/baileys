import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TableRowSkeletonProps {
	avatar?: boolean;
	columns?: number;
}

const TableRowSkeleton: React.FC<TableRowSkeletonProps> = ({
	avatar = false,
	columns = 5
}) => {
	return (
		<>
			<TableRow>
				{avatar && (
					<>
						<TableCell className="pr-0">
							<Skeleton className="h-10 w-10 rounded-full" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-7 w-20" />
						</TableCell>
					</>
				)}
				{Array.from({ length: columns }, (_, index) => (
					<TableCell className="text-center" key={index}>
						<div className="flex items-center justify-center">
							<Skeleton className="h-7 w-20" />
						</div>
					</TableCell>
				))}
			</TableRow>
		</>
	);
};

export default TableRowSkeleton;